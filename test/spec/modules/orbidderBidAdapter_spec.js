import { expect } from 'chai';
import { spec } from 'modules/orbidderBidAdapter.js';
import { newBidder } from 'src/adapters/bidderFactory.js';
import * as _ from 'lodash';
import { BANNER, NATIVE } from '../../../src/mediaTypes.js';
import {getGlobal} from '../../../src/prebidGlobal.js';

describe('orbidderBidAdapter', () => {
  const adapter = newBidder(spec);
  const defaultBidRequestBanner = {
    bidId: 'd66fa86787e0b0ca900a96eacfd5f0bb',
    auctionId: 'ccc4c7cdfe11cfbd74065e6dd28413d8',
    transactionId: 'd58851660c0c4461e4aa06344fc9c0c6',
    bidRequestCount: 1,
    adUnitCode: 'adunit-code',
    sizes: [[300, 250], [300, 600]],
    params: {
      'accountId': 'string1',
      'placementId': 'string2',
      'bidfloor': 1.23
    },
    mediaTypes: {
      banner: {
        sizes: [[300, 250], [300, 600]]
      }
    },
    userId: {
      'id5id': {
        'uid': 'ID5*XXXXXXXXXXXXX',
        'ext': {
          'linkType': 2,
          'pba': 'XXXXXXXXXXXX=='
        }
      }
    },
    userIdAsEids: [
      {
        'source': 'id5-sync.com',
        'uids': [
          {
            'id': 'ID5*XXXXXXXXXXXXX',
            'atype': 1,
            'ext': {
              'linkType': 2,
              'pba': 'XXXXXXXXXXXX=='
            }
          }
        ]
      }
    ]
  };

  const defaultBidRequestNative = {
    bidId: 'd66fa86787e0b0ca900a96eacfd5f0bc',
    auctionId: 'ccc4c7cdfe11cfbd74065e6dd28413d9',
    transactionId: 'd58851660c0c4461e4aa06344fc9c0c6',
    bidRequestCount: 1,
    adUnitCode: 'adunit-code-native',
    sizes: [],
    params: {
      'accountId': 'string3',
      'placementId': 'string4',
      'bidfloor': 2.34
    },
    mediaTypes: {
      native: {
        title: {
          required: true
        },
        image: {
          required: true,
          sizes: [300, 250]
        },
        sponsoredBy: {
          required: true
        }
      }
    },
    userId: {
      'id5id': {
        'uid': 'ID5*YYYYYYYYYYYYYYY',
        'ext': {
          'linkType': 2,
          'pba': 'YYYYYYYYYYYYY=='
        }
      }
    },
    userIdAsEids: [
      {
        'source': 'id5-sync.com',
        'uids': [
          {
            'id': 'ID5*YYYYYYYYYYYYYYY',
            'atype': 1,
            'ext': {
              'linkType': 2,
              'pba': 'YYYYYYYYYYYYY=='
            }
          }
        ]
      }
    ]
  };

  const deepClone = function(val) {
    return JSON.parse(JSON.stringify(val));
  };

  const buildRequest = (buildRequest, bidderRequest) => {
    if (!Array.isArray(buildRequest)) {
      buildRequest = [buildRequest];
    }

    return spec.buildRequests(buildRequest, {
      ...bidderRequest || {},
      refererInfo: {
        page: 'https://localhost:9876/'
      }
    })[0];
  };

  describe('inherited functions', () => {
    it('exists and is a function', () => {
      expect(adapter.callBids).to.exist.and.to.be.a('function');
    });
  });

  describe('isBidRequestValid', () => {
    it('banner: should return true when required params found', () => {
      expect(spec.isBidRequestValid(defaultBidRequestBanner)).to.equal(true);
    });

    it('native: should return true when required params found', () => {
      expect(spec.isBidRequestValid(defaultBidRequestNative)).to.equal(true);
    });

    it('banner: accepts optional keyValues object', () => {
      const bidRequest = deepClone(defaultBidRequestBanner);
      bidRequest.params.keyValues = { 'key': 'value' };
      expect(spec.isBidRequestValid(bidRequest)).to.equal(true);
    });

    it('native: accepts optional keyValues object', () => {
      const bidRequest = deepClone(defaultBidRequestNative);
      bidRequest.params.keyValues = { 'key': 'value' };
      expect(spec.isBidRequestValid(bidRequest)).to.equal(true);
    });

    it('banner: performs type checking', () => {
      const bidRequest = deepClone(defaultBidRequestBanner);
      bidRequest.params.accountId = 1; // supposed to be a string
      expect(spec.isBidRequestValid(bidRequest)).to.equal(false);
    });

    it('native: performs type checking', () => {
      const bidRequest = deepClone(defaultBidRequestNative);
      bidRequest.params.accountId = 1; // supposed to be a string
      expect(spec.isBidRequestValid(bidRequest)).to.equal(false);
    });

    it('banner: doesn\'t accept malformed keyValues', () => {
      const bidRequest = deepClone(defaultBidRequestBanner);
      bidRequest.params.keyValues = 'another not usable string';
      expect(spec.isBidRequestValid(bidRequest)).to.equal(false);
    });

    it('native: doesn\'t accept malformed keyValues', () => {
      const bidRequest = deepClone(defaultBidRequestNative);
      bidRequest.params.keyValues = 'another not usable string';
      expect(spec.isBidRequestValid(bidRequest)).to.equal(false);
    });

    it('banner: should return false when required params are not passed', () => {
      const bidRequest = deepClone(defaultBidRequestBanner);
      delete bidRequest.params;
      expect(spec.isBidRequestValid(bidRequest)).to.equal(false);
    });

    it('native: should return false when required params are not passed', () => {
      const bidRequest = deepClone(defaultBidRequestNative);
      delete bidRequest.params;
      expect(spec.isBidRequestValid(bidRequest)).to.equal(false);
    });

    it('banner: accepts optional bidfloor', () => {
      const bidRequest = deepClone(defaultBidRequestBanner);
      bidRequest.params.bidfloor = 123;
      expect(spec.isBidRequestValid(bidRequest)).to.equal(true);

      bidRequest.params.bidfloor = 1.23;
      expect(spec.isBidRequestValid(bidRequest)).to.equal(true);
    });

    it('native: accepts optional bidfloor', () => {
      const bidRequest = deepClone(defaultBidRequestNative);
      bidRequest.params.bidfloor = 123;
      expect(spec.isBidRequestValid(bidRequest)).to.equal(true);

      bidRequest.params.bidfloor = 1.23;
      expect(spec.isBidRequestValid(bidRequest)).to.equal(true);
    });
  });

  describe('buildRequests', () => {
    let request, nativeRequest;
    before(() => {
      request = buildRequest(defaultBidRequestBanner);
      nativeRequest = buildRequest(defaultBidRequestNative);
    })

    it('sends bid request to endpoint via https using post', () => {
      expect(request.method).to.equal('POST');
      expect(request.url.indexOf('https://')).to.equal(0);
      expect(request.url).to.equal(`${spec.hostname}/bid`);
    });

    it('contains prebid version parameter', () => {
      expect(request.data.v).to.equal(getGlobal().version);
    });

    it('banner: sends correct bid parameters', () => {
      // we add two, because we add pageUrl and version from bidderRequest object
      expect(Object.keys(request.data).length).to.equal(Object.keys(defaultBidRequestBanner).length + 2);

      const expectedBidRequest = deepClone(defaultBidRequestBanner);
      expectedBidRequest.pageUrl = 'https://localhost:9876/';
      expectedBidRequest.v = getGlobal().version;
      expect(request.data).to.deep.equal(expectedBidRequest);
    });

    it('native: sends correct bid parameters', () => {
      // we add two, because we add pageUrl and version from bidderRequest object
      expect(Object.keys(nativeRequest.data).length).to.equal(Object.keys(defaultBidRequestNative).length + 2);

      const expectedBidRequest = deepClone(defaultBidRequestNative);
      expectedBidRequest.pageUrl = 'https://localhost:9876/';
      expectedBidRequest.v = getGlobal().version;
      expect(nativeRequest.data).to.deep.equal(expectedBidRequest);
    });

    it('banner: handles empty gdpr object', () => {
      const request = buildRequest(defaultBidRequestBanner, {
        gdprConsent: {}
      });
      expect(request.data.gdprConsent.consentRequired).to.be.equal(false);
    });

    it('native: handles empty gdpr object', () => {
      const request = buildRequest(defaultBidRequestNative, {
        gdprConsent: {}
      });
      expect(request.data.gdprConsent.consentRequired).to.be.equal(false);
    });

    it('banner: handles non-existent gdpr object', () => {
      const request = buildRequest(defaultBidRequestBanner, {
        gdprConsent: null
      });
      expect(request.data.gdprConsent).to.be.undefined;
    });

    it('native: handles non-existent gdpr object', () => {
      const request = buildRequest(defaultBidRequestNative, {
        gdprConsent: null
      });
      expect(request.data.gdprConsent).to.be.undefined;
    });

    it('banner: handles properly filled gdpr object where gdpr applies', () => {
      const consentString = 'someWeirdString';
      const request = buildRequest(defaultBidRequestBanner, {
        gdprConsent: {
          gdprApplies: true,
          consentString: consentString
        }
      });

      const gdprConsent = request.data.gdprConsent;
      expect(gdprConsent.consentRequired).to.be.equal(true);
      expect(gdprConsent.consentString).to.be.equal(consentString);
    });

    it('native: handles properly filled gdpr object where gdpr applies', () => {
      const consentString = 'someWeirdString';
      const request = buildRequest(defaultBidRequestNative, {
        gdprConsent: {
          gdprApplies: true,
          consentString: consentString
        }
      });

      const gdprConsent = request.data.gdprConsent;
      expect(gdprConsent.consentRequired).to.be.equal(true);
      expect(gdprConsent.consentString).to.be.equal(consentString);
    });

    it('banner: handles properly filled gdpr object where gdpr does not apply', () => {
      const consentString = 'someWeirdString';
      const request = buildRequest(defaultBidRequestBanner, {
        gdprConsent: {
          gdprApplies: false,
          consentString: consentString
        }
      });

      const gdprConsent = request.data.gdprConsent;
      expect(gdprConsent.consentRequired).to.be.equal(false);
      expect(gdprConsent.consentString).to.be.equal(consentString);
    });

    it('native: handles properly filled gdpr object where gdpr does not apply', () => {
      const consentString = 'someWeirdString';
      const request = buildRequest(defaultBidRequestNative, {
        gdprConsent: {
          gdprApplies: false,
          consentString: consentString
        }
      });

      const gdprConsent = request.data.gdprConsent;
      expect(gdprConsent.consentRequired).to.be.equal(false);
      expect(gdprConsent.consentString).to.be.equal(consentString);
    });
  });

  it('buildRequests with price floor module', () => {
    const bidRequest = deepClone(defaultBidRequestBanner);
    bidRequest.params.bidfloor = 1;
    bidRequest.getFloor = (floorObj) => {
      return {
        floor: bidRequest.floors.values['banner|640x480'],
        currency: floorObj.currency,
        mediaType: floorObj.mediaType
      }
    };

    bidRequest.floors = {
      currency: 'EUR',
      values: {
        'banner|640x480': 15.07
      }
    };
    const request = buildRequest(bidRequest);
    expect(request.data.params.bidfloor).to.equal(15.07);
  });

  describe('interpretResponse', () => {
    it('banner: should get correct bid response', () => {
      const serverResponse = [
        {
          'width': 300,
          'height': 250,
          'creativeId': '29681110',
          'ad': '<!-- Creative -->',
          'cpm': 0.5,
          'requestId': '30b31c1838de1e',
          'ttl': 60,
          'netRevenue': true,
          'currency': 'EUR',
          'mediaType': BANNER,
        }
      ];

      const expectedResponse = [
        {
          'requestId': '30b31c1838de1e',
          'cpm': 0.5,
          'creativeId': '29681110',
          'width': 300,
          'height': 250,
          'ttl': 60,
          'currency': 'EUR',
          'ad': '<!-- Creative -->',
          'netRevenue': true,
          'mediaType': BANNER,
        }
      ];

      const result = spec.interpretResponse({ body: serverResponse });
      expect(result.length).to.equal(expectedResponse.length);
      expect(_.isEqual(expectedResponse, serverResponse)).to.be.true;
    });

    it('should get correct bid response with advertiserDomains', () => {
      const serverResponse = [
        {
          'width': 300,
          'height': 250,
          'creativeId': '29681110',
          'ad': '<!-- Creative -->',
          'cpm': 0.5,
          'requestId': '30b31c1838de1e',
          'ttl': 60,
          'netRevenue': true,
          'currency': 'EUR',
          'advertiserDomains': ['cm.tavira.pt'],
          'mediaType': BANNER
        }
      ];

      const expectedResponse = [
        {
          'requestId': '30b31c1838de1e',
          'cpm': 0.5,
          'creativeId': '29681110',
          'width': 300,
          'height': 250,
          'ttl': 60,
          'currency': 'EUR',
          'ad': '<!-- Creative -->',
          'netRevenue': true,
          'meta': {
            'advertiserDomains': ['cm.tavira.pt']
          },
          'mediaType': BANNER
        }
      ];

      const result = spec.interpretResponse({ body: serverResponse });

      expect(result.length).to.equal(expectedResponse.length);
      Object.keys(expectedResponse[0]).forEach((key) => {
        expect(result[0][key]).to.deep.equal(expectedResponse[0][key]);
      });
    });

    it('native: should get correct bid response', () => {
      const serverResponse = [
        {
          'creativeId': '29681110',
          'cpm': 0.5,
          'requestId': '30b31c1838de1e',
          'ttl': 60,
          'netRevenue': true,
          'currency': 'EUR',
          'mediaType': NATIVE,
          'native': {
            'image': {
              'url': 'image url',
              'width': 300,
              'height': 250,
            },
            'icon': {
              'url': 'icon url',
              'width': 50,
              'height': 50,
            },
            'impressionTrackers': 'imp tracker',
            'clickUrl': 'click',
            'sponsoredBy': 'brand',
            'cta': 'action',
            'body': 'text',
          }
        }
      ];

      const expectedResponse = [
        {
          'creativeId': '29681110',
          'cpm': 0.5,
          'requestId': '30b31c1838de1e',
          'ttl': 60,
          'netRevenue': true,
          'currency': 'EUR',
          'mediaType': NATIVE,
          'native': {
            'image': {
              'url': 'image url',
              'width': 300,
              'height': 250,
            },
            'icon': {
              'url': 'icon url',
              'width': 50,
              'height': 50,
            },
            'impressionTrackers': 'imp tracker',
            'clickUrl': 'click',
            'sponsoredBy': 'brand',
            'cta': 'action',
            'body': 'text',
          }
        }
      ];

      const result = spec.interpretResponse({ body: serverResponse });

      expect(result.length).to.equal(expectedResponse.length);
      expect(_.isEqual(expectedResponse, serverResponse)).to.be.true;
    });

    it('banner: handles broken bid response, missing creativeId', () => {
      const serverResponse = [
        {
          'ad': '<!-- Creative -->',
          'cpm': 0.5,
          'requestId': '30b31c1838de1e',
          'ttl': 60,
          'currency': 'EUR',
          'mediaType': BANNER,
          'width': 300,
          'height': 250,
          'netRevenue': true,
        }
      ];
      const result = spec.interpretResponse({ body: serverResponse });
      expect(result.length).to.equal(0);
    });

    it('banner: handles broken bid response, missing ad', () => {
      const serverResponse = [
        {
          'cpm': 0.5,
          'requestId': '30b31c1838de1e',
          'ttl': 60,
          'currency': 'EUR',
          'mediaType': BANNER,
          'width': 300,
          'height': 250,
          'netRevenue': true,
          'creativeId': '29681110',
        }
      ];
      const result = spec.interpretResponse({ body: serverResponse });
      expect(result.length).to.equal(0);
    });

    it('native: handles broken bid response, missing impressionTrackers', () => {
      const serverResponse = [
        {
          'creativeId': '29681110',
          'cpm': 0.5,
          'requestId': '30b31c1838de1e',
          'ttl': 60,
          'netRevenue': true,
          'currency': 'EUR',
          'mediaType': NATIVE,
          'native': {
            'title': 'native title',
            'sponsoredBy': 'test brand',
            'image': {
              'url': 'image url',
              'width': 300,
              'height': 250,
            },
            'clickUrl': 'click'
          }
        }
      ];
      const result = spec.interpretResponse({ body: serverResponse });
      expect(result.length).to.equal(0);
    });

    it('handles nobid responses', () => {
      const serverResponse = [];
      const result = spec.interpretResponse({ body: serverResponse });
      expect(result.length).to.equal(0);
    });
  });
});
