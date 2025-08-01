import { expect } from 'chai'
import { ENDPOINT, spec } from 'modules/alkimiBidAdapter.js'
import { newBidder } from 'src/adapters/bidderFactory.js'

const REQUEST = {
  'bidId': '456',
  'bidder': 'alkimi',
  'sizes': [[300, 250]],
  'adUnitCode': 'bannerAdUnitCode',
  'ortb2Imp': {
    'ext': {
      'gpid': '/111/banner#300x250',
      'tid': 'e64782a4-8e68-4c38-965b-80ccf115d46a'
    }
  },
  'mediaTypes': {
    'banner': {
      'sizes': [[300, 250]]
    }
  },
  'params': {
    bidFloor: 0.1,
    token: 'e64782a4-8e68-4c38-965b-80ccf115d46f'
  },
  'userIdAsEids': [{
    'source': 'criteo.com',
    'uids': [{
      'id': 'test',
      'atype': 1
    }]
  }, {
    'source': 'pubcid.org',
    'uids': [{
      'id': 'test',
      'atype': 1
    }]
  }],
  'ortb2': {
    'source': {
      'ext': {
        'schain': {
          ver: '1.0',
          complete: 1,
          nodes: [{
            asi: 'alkimi-onboarding.com',
            sid: '00001',
            hp: 1
          }]
        }
      }
    }
  }
}

const BIDDER_BANNER_RESPONSE = {
  'prebidResponse': [{
    'ad': '<div>test</div>',
    'requestId': 'e64782a4-8e68-4c38-965b-80ccf115d46d',
    'cpm': 900.5,
    'currency': 'USD',
    'width': 640,
    'height': 480,
    'ttl': 300,
    'creativeId': 1,
    'netRevenue': true,
    'winUrl': 'http://test.com',
    'mediaType': 'banner',
    'adomain': ['test.com']
  }]
}

const BIDDER_VIDEO_RESPONSE = {
  'prebidResponse': [{
    'ad': '<xml>vast</xml>',
    'requestId': 'e64782a4-8e68-4c38-965b-80ccf115d46z',
    'cpm': 800.4,
    'currency': 'USD',
    'width': 1024,
    'height': 768,
    'ttl': 200,
    'creativeId': 2,
    'netRevenue': true,
    'winUrl': 'http://test.com?price=${AUCTION_PRICE}',
    'mediaType': 'video',
    'adomain': ['test.com']
  }]
}

const BIDDER_NO_BID_RESPONSE = ''

describe('alkimiBidAdapter', function () {
  const adapter = newBidder(spec)

  describe('inherited functions', function () {
    it('exists and is a function', function () {
      expect(adapter.callBids).to.exist.and.to.be.a('function')
    })
  })

  describe('isBidRequestValid', function () {
    it('should return true when required params found', function () {
      expect(spec.isBidRequestValid(REQUEST)).to.equal(true)
    })

    it('should return false when required params are not passed', function () {
      let bid = JSON.parse(JSON.stringify(REQUEST))
      delete bid.params.token
      expect(spec.isBidRequestValid(bid)).to.equal(false)

      bid = JSON.parse(JSON.stringify(REQUEST))
      delete bid.params
      expect(spec.isBidRequestValid(bid)).to.equal(false)
    })
  })

  describe('buildRequests', function () {
    const bidRequests = [REQUEST]
    const requestData = {
      refererInfo: {
        page: 'http://test.com/path.html'
      },
      gdprConsent: {
        consentString: 'test-consent',
        vendorData: {},
        gdprApplies: true
      },
      uspConsent: 'uspConsent',
      ortb2: {
        site: {
          keywords: 'test1, test2',
          cat: ['IAB2'],
          pagecat: ['IAB3'],
          sectioncat: ['IAB4']
        },
        at: 2,
        bcat: ['BSW1', 'BSW2'],
        wseat: ['16', '165']
      }
    }

    it('should return a properly formatted request with eids defined', function () {
      const bidderRequest = spec.buildRequests(bidRequests, requestData)
      expect(bidderRequest.data.eids).to.deep.equal(REQUEST.userIdAsEids)
    })

    it('should return a properly formatted request with gdpr defined', function () {
      const bidderRequest = spec.buildRequests(bidRequests, requestData)
      expect(bidderRequest.data.gdprConsent.consentRequired).to.equal(true)
      expect(bidderRequest.data.gdprConsent.consentString).to.equal('test-consent')
    })

    it('should return a properly formatted request with uspConsent defined', function () {
      const bidderRequest = spec.buildRequests(bidRequests, requestData)
      expect(bidderRequest.data.uspConsent).to.equal('uspConsent')
    })

    it('sends bid request to ENDPOINT via POST', function () {
      const bidderRequest = spec.buildRequests(bidRequests, requestData)
      expect(bidderRequest.method).to.equal('POST')
      expect(bidderRequest.data.requestId).to.not.equal(undefined)
      expect(bidderRequest.data.referer).to.equal('http://test.com/path.html')
      expect(bidderRequest.data.schain).to.deep.equal({ ver: '1.0', complete: 1, nodes: [{ asi: 'alkimi-onboarding.com', sid: '00001', hp: 1 }] })
      expect(bidderRequest.data.signRequest.bids).to.deep.contains({ token: 'e64782a4-8e68-4c38-965b-80ccf115d46f', bidFloor: 0.1, sizes: [{ width: 300, height: 250 }], playerSizes: [], impMediaTypes: ['Banner'], adUnitCode: 'bannerAdUnitCode', instl: undefined, exp: undefined, banner: { sizes: [[300, 250]] }, video: undefined, ext: { gpid: '/111/banner#300x250', tid: 'e64782a4-8e68-4c38-965b-80ccf115d46a' } })
      expect(bidderRequest.data.signRequest.randomUUID).to.equal(undefined)
      expect(bidderRequest.data.bidIds).to.deep.contains('456')
      expect(bidderRequest.data.signature).to.equal(undefined)
      expect(bidderRequest.data.ortb2).to.deep.contains({ at: 2, wseat: ['16', '165'], bcat: ['BSW1', 'BSW2'], site: { keywords: 'test1, test2', cat: ['IAB2'], pagecat: ['IAB3'], sectioncat: ['IAB4'] } })
      expect(bidderRequest.options.customHeaders).to.deep.equal({ 'Rtb-Direct': true })
      expect(bidderRequest.options.contentType).to.equal('application/json')
      expect(bidderRequest.url).to.equal(ENDPOINT)
    })

    it('sends bidFloor when configured', () => {
      const requestWithFloor = Object.assign({}, REQUEST);
      requestWithFloor.getFloor = function (arg) {
        if (arg.currency === 'USD' && arg.mediaType === 'banner' && JSON.stringify(arg.size) === JSON.stringify([300, 250])) {
          return { currency: 'USD', floor: 0.3 }
        }
      }
      const bidderRequestFloor = spec.buildRequests([requestWithFloor], requestData);
      expect(bidderRequestFloor.data.signRequest.bids[0].bidFloor).to.be.equal(0.3);
    });
  })

  describe('interpretResponse', function () {
    it('handles banner request : should get correct bid response', function () {
      const result = spec.interpretResponse({ body: BIDDER_BANNER_RESPONSE }, {})

      expect(result[0]).to.have.property('ad').equal('<div>test</div>')
      expect(result[0]).to.have.property('requestId').equal('e64782a4-8e68-4c38-965b-80ccf115d46d')
      expect(result[0]).to.have.property('cpm').equal(900.5)
      expect(result[0]).to.have.property('currency').equal('USD')
      expect(result[0]).to.have.property('width').equal(640)
      expect(result[0]).to.have.property('height').equal(480)
      expect(result[0]).to.have.property('ttl').equal(300)
      expect(result[0]).to.have.property('creativeId').equal(1)
      expect(result[0]).to.have.property('netRevenue').equal(true)
      expect(result[0]).to.have.property('winUrl').equal('http://test.com')
      expect(result[0]).to.have.property('mediaType').equal('banner')
      expect(result[0].meta).to.exist.property('advertiserDomains')
      expect(result[0].meta).to.have.property('advertiserDomains').lengthOf(1)
    })

    it('handles video request : should get correct bid response', function () {
      const result = spec.interpretResponse({ body: BIDDER_VIDEO_RESPONSE }, {})

      expect(result[0]).to.have.property('ad').equal('<xml>vast</xml>')
      expect(result[0]).to.have.property('requestId').equal('e64782a4-8e68-4c38-965b-80ccf115d46z')
      expect(result[0]).to.have.property('cpm').equal(800.4)
      expect(result[0]).to.have.property('currency').equal('USD')
      expect(result[0]).to.have.property('width').equal(1024)
      expect(result[0]).to.have.property('height').equal(768)
      expect(result[0]).to.have.property('ttl').equal(200)
      expect(result[0]).to.have.property('creativeId').equal(2)
      expect(result[0]).to.have.property('netRevenue').equal(true)
      expect(result[0]).to.have.property('winUrl').equal('http://test.com?price=${AUCTION_PRICE}')
      expect(result[0]).to.have.property('mediaType').equal('video')
      expect(result[0]).to.have.property('vastUrl').equal('http://test.com?price=800.4')
      expect(result[0].meta).to.exist.property('advertiserDomains')
      expect(result[0].meta).to.have.property('advertiserDomains').lengthOf(1)
    })

    it('handles no bid response : should get empty array', function () {
      let result = spec.interpretResponse({ body: undefined }, {})
      expect(result).to.deep.equal([])

      result = spec.interpretResponse({ body: BIDDER_NO_BID_RESPONSE }, {})
      expect(result).to.deep.equal([])
    })
  })

  describe('onBidWon', function () {
    it('handles banner win: should get true', function () {
      const win = BIDDER_BANNER_RESPONSE.prebidResponse[0]
      const bidWonResult = spec.onBidWon(win)

      expect(bidWonResult).to.equal(true)
    })
  })
})
