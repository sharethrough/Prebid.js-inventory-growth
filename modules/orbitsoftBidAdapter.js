import * as utils from '../src/utils.js';
import {registerBidder} from '../src/adapters/bidderFactory.js';
import {getBidIdParameter} from '../src/utils.js';

const BIDDER_CODE = 'orbitsoft';
const styleParamsMap = {
  'title.family': 'f1', // headerFont
  'title.size': 'fs1', // headerFontSize
  'title.weight': 'w1', // headerWeight
  'title.style': 's1', // headerStyle
  'title.color': 'c3', // headerColor
  'description.family': 'f2', // descriptionFont
  'description.size': 'fs2', // descriptionFontSize
  'description.weight': 'w2', // descriptionWeight
  'description.style': 's2', // descriptionStyle
  'description.color': 'c4', // descriptionColor
  'url.family': 'f3', // urlFont
  'url.size': 'fs3', // urlFontSize
  'url.weight': 'w3', // urlWeight
  'url.style': 's3', // urlStyle
  'url.color': 'c5', // urlColor
  'colors.background': 'c2', // borderColor
  'colors.border': 'c1', // borderColor
  'colors.link': 'c6', // lnkColor
};
export const spec = {
  code: BIDDER_CODE,
  aliases: ['oas', '152media', 'paradocs'], // short code and customer aliases
  isBidRequestValid: function (bid) {
    switch (true) {
      case !('params' in bid):
        utils.logError(bid.bidder + ': No required params');
        return false;
      case !(bid.params.placementId):
        utils.logError(bid.bidder + ': No required param placementId');
        return false;
      case !(bid.params.requestUrl):
        utils.logError(bid.bidder + ': No required param requestUrl');
        return false;
    }
    return true;
  },
  buildRequests: function (validBidRequests) {
    let bidRequest;
    const serverRequests = [];
    for (let i = 0; i < validBidRequests.length; i++) {
      bidRequest = validBidRequests[i];
      const bidRequestParams = bidRequest.params;
      const placementId = getBidIdParameter('placementId', bidRequestParams);
      const requestUrl = getBidIdParameter('requestUrl', bidRequestParams);
      let referrer = getBidIdParameter('ref', bidRequestParams);
      let location = getBidIdParameter('loc', bidRequestParams);
      // Append location & referrer
      if (location === '') {
        location = utils.getWindowLocation();
      }
      if (referrer === '' && bidRequest && bidRequest.refererInfo) {
        referrer = bidRequest.refererInfo.referer;
      }

      // Styles params
      const stylesParams = getBidIdParameter('style', bidRequestParams);
      const stylesParamsArray = {};
      for (const currentValue in stylesParams) {
        if (stylesParams.hasOwnProperty(currentValue)) {
          const currentStyle = stylesParams[currentValue];
          for (const field in currentStyle) {
            if (currentStyle.hasOwnProperty(field)) {
              const styleField = styleParamsMap[currentValue + '.' + field];
              if (typeof styleField !== 'undefined') {
                stylesParamsArray[styleField] = currentStyle[field];
              }
            }
          }
        }
      }
      // Custom params
      const customParams = getBidIdParameter('customParams', bidRequestParams);
      const customParamsArray = {};
      for (const customField in customParams) {
        if (customParams.hasOwnProperty(customField)) {
          customParamsArray['c.' + customField] = customParams[customField];
        }
      }

      // Sizes params (not supports by server, for future features)
      const sizesParams = bidRequest.sizes;
      const parsedSizes = utils.parseSizesInput(sizesParams);
      const requestData = Object.assign({
        'scid': placementId,
        'callback_uid': utils.generateUUID(),
        'loc': location,
        'ref': referrer,
        'size': parsedSizes
      }, stylesParamsArray, customParamsArray);

      serverRequests.push({
        method: 'POST',
        url: requestUrl,
        data: requestData,
        options: {withCredentials: false},
        bidRequest: bidRequest
      });
    }
    return serverRequests;
  },
  interpretResponse: function (serverResponse, request) {
    const bidResponses = [];
    if (!serverResponse || serverResponse.error) {
      utils.logError(BIDDER_CODE + ': Server response error');
      return bidResponses;
    }

    const serverBody = serverResponse.body;
    if (!serverBody) {
      utils.logError(BIDDER_CODE + ': Empty bid response');
      return bidResponses;
    }

    const CPM = serverBody.cpm;
    const WIDTH = serverBody.width;
    const HEIGHT = serverBody.height;
    const CREATIVE = serverBody.content_url;
    const CALLBACK_UID = serverBody.callback_uid;
    const TIME_TO_LIVE = 60;
    const REFERER = utils.getWindowTop();
    const bidRequest = request.bidRequest;
    if (CPM > 0 && WIDTH > 0 && HEIGHT > 0) {
      const bidResponse = {
        requestId: bidRequest.bidId,
        cpm: CPM,
        width: WIDTH,
        height: HEIGHT,
        creativeId: CALLBACK_UID,
        ttl: TIME_TO_LIVE,
        referrer: REFERER,
        currency: 'USD',
        netRevenue: true,
        adUrl: CREATIVE,
        meta: {
          advertiserDomains: serverBody.adomain ? serverBody.adomain : []
        }
      };
      bidResponses.push(bidResponse);
    }

    return bidResponses;
  }
};
registerBidder(spec);
