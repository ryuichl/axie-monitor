;(async function () {
  try {
    const CronJob = require('cron').CronJob
    const got = require('got')
    const Promise = require('bluebird')
    const dayjs = require('dayjs')

    const last_axie = async (auth) => {
      const options = {
        method: 'POST',
        url: 'https://axieinfinity.com/graphql-server-v2/graphql',
        headers: {
          authorization: `Bearer ${auth}`
        },
        json: {
          operationName: 'GetAxieLatest',
          variables: { from: 0, size: 10, sort: 'Latest', auctionType: 'Sale' },
          query:
            'query GetAxieLatest($auctionType: AuctionType, $criteria: AxieSearchCriteria, $from: Int, $sort: SortBy, $size: Int, $owner: String) {\n  axies(auctionType: $auctionType, criteria: $criteria, from: $from, sort: $sort, size: $size, owner: $owner) {\n    total\n    results {\n      ...AxieRowData\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment AxieRowData on Axie {\n  id\n  image\n  class\n  name\n  genes\n  owner\n  class\n  stage\n  title\n  breedCount\n  level\n  parts {\n    ...AxiePart\n    __typename\n  }\n  stats {\n    ...AxieStats\n    __typename\n  }\n  auction {\n    ...AxieAuction\n    __typename\n  }\n  __typename\n}\n\nfragment AxiePart on AxiePart {\n  id\n  name\n  class\n  type\n  specialGenes\n  stage\n  abilities {\n    ...AxieCardAbility\n    __typename\n  }\n  __typename\n}\n\nfragment AxieCardAbility on AxieCardAbility {\n  id\n  name\n  attack\n  defense\n  energy\n  description\n  backgroundUrl\n  effectIconUrl\n  __typename\n}\n\nfragment AxieStats on AxieStats {\n  hp\n  speed\n  skill\n  morale\n  __typename\n}\n\nfragment AxieAuction on Auction {\n  startingPrice\n  endingPrice\n  startingTimestamp\n  endingTimestamp\n  duration\n  timeLeft\n  currentPrice\n  currentPriceUSD\n  suggestedPrice\n  seller\n  listingIndex\n  state\n  __typename\n}\n'
        },
        responseType: 'json',
        resolveBodyOnly: true
      }
      const result = await got(options)
      return result.data.axies.results
    }
    const last_land = async (auth) => {
      const options = {
        method: 'POST',
        url: 'https://axieinfinity.com/graphql-server-v2/graphql',
        headers: {
          authorization: `Bearer ${auth}`
        },
        json: {
          operationName: 'GetLatestLands',
          variables: { from: 0, size: 10, sort: 'Latest' },
          query:
            'query GetLatestLands($from: Int!, $size: Int!, $sort: SortBy!) {\n  lands(from: $from, size: $size, sort: $sort) {\n    results {\n      ...LandBriefV2\n      __typename\n    }\n    __typename\n  }\n}\n\nfragment LandBriefV2 on LandPlot {\n  tokenId\n  owner\n  landType\n  row\n  col\n  auction {\n    currentPrice\n    startingTimestamp\n    currentPriceUSD\n    __typename\n  }\n  ownerProfile {\n    name\n    __typename\n  }\n  __typename\n}\n'
        },
        responseType: 'json',
        resolveBodyOnly: true
      }
      const result = await got(options)
      return result.data.lands.results
    }
    const line_notify = async (keys, message) => {
      if (keys.length === 0) {
        return true
      }
      let options = {
        method: 'POST',
        url: 'https://notify-api.line.me/api/notify',
        headers: {},
        form: {
          message: message
        },
        responseType: 'json',
        resolveBodyOnly: true
      }
      const result = await Promise.map(keys, (key) => {
        options.headers.Authorization = `Bearer ${key}`
        return got(options)
      })
      return result
    }
    const message_template = (type, body) => {
      let message
      if (type === 'axie') {
        message =
          'axie發現通知!!!\n時間 : ' +
          new Date() +
          '\n' +
          'class : ' +
          body.class +
          '\n' +
          'price : ' +
          body.price +
          '\n' +
          'breedCount : ' +
          body.breedCount +
          '\n' +
          'stats : ' +
          Object.values(body.stats).join() +
          '\n' +
          'parts : ' +
          body.parts +
          '\n' +
          '網址 : ' +
          `https://marketplace.axieinfinity.com/axie/${body.id}`
      } else {
        message =
          '土地低價通知!!!\n時間 : ' +
          new Date() +
          '\n' +
          'price : ' +
          body.price +
          '\n' +
          'type : ' +
          body.landType +
          '\n' +
          '網址 : ' +
          `https://marketplace.axieinfinity.com/land/${body.col}/${body.row}`
      }
      return message
    }

    const auth =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50SWQiOjg4NjkyNywiYWN0aXZhdGVkIjp0cnVlLCJyb25pbkFkZHJlc3MiOiIweGJlOWJhZGE2MDNiZWIwMzNmZWZjYWJlNDRmNzEyNDZiMzE1MjI4M2YiLCJldGhBZGRyZXNzIjoiMHg4Yzk2MzlkZDkxMGFlMTY2ZGZmYWY3ZmRhZWEwZjJiNGQ5MjA1OGQ4IiwiaWF0IjoxNjI5MzAyNzM1LCJleHAiOjE2Mjk5MDc1MzUsImlzcyI6IkF4aWVJbmZpbml0eSJ9.MfORH_M-Ze-eg5RhhYBqkpzEd8KOFvdd1_cA3dVtvHM'
    const lineToken = 'dgG1XG98iL2YIQCpYDJFlFSaITxsUNPMvjnwuWpJD5k'

    //parts = ['Eyes', 'Ears', 'Back', 'Mouth', 'Horn', 'Tail']
    // new CronJob({
    //   cronTime: '*/20 * * * * *',
    //   onTick: async () => {
    //     console.log('axie', dayjs().format())
    //     const axies = await last_axie(auth)
    //     await Promise.mapSeries(axies, async (axie, index) => {
    //       if (axie.parts[2] && axie.parts[3] && axie.stats.speed > 42 && axie.parts[2].name === 'Snail Shell' && axie.parts[3].name === 'Cute Bunny') {
    //         const price = Number(axie.auction.currentPrice.slice(0, -16)) / 100
    //         const parts = axie.parts.map((part) => {
    //           return part.name
    //         })
    //         const message = message_template('axie', {
    //           class: axie.class,
    //           breedCount: axie.breedCount,
    //           id: axie.id,
    //           parts: parts.join(', '),
    //           price: price,
    //           stats: axie.stats
    //         })
    //         await line_notify([lineToken], message)
    //       }
    //     })
    //   },
    //   start: true,
    //   timeZone: 'Asia/Taipei'
    // })
    new CronJob({
      cronTime: '*/20 * * * * *',
      onTick: async () => {
        console.log('land', dayjs().format())
        const lands = await last_land(auth)
        await Promise.mapSeries(lands, async (land, index) => {
          const price = Number(land.auction.currentPrice.slice(0, -16)) / 100
          if (price < 3) {
            const message = message_template('land', { price: price, landType: land.landType, col: land.col, row: land.row })
            await line_notify([lineToken], message)
          }
        })
      },
      start: true,
      timeZone: 'Asia/Taipei'
    })
  } catch (err) {
    console.log(err)
  }
  // return process.exit(0)
})()
