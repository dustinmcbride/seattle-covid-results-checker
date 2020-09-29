const fetch = require('node-fetch');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { MINS_BETWEEN_CHECKS, USERS } = require('./config');

function parseHtmlAndGetStatus(html) {
  const dom = new JSDOM(html);
  let parsed = dom.window.document
    .querySelector(
      '#result-card > div > table > tbody > tr:nth-child(2) > td:nth-child(2) > span'
    )
    .textContent.trim();
  return parsed;
}

function getStatus(html, user) {
  let raw = parseHtmlAndGetStatus(html);

  if (raw !== 'Awaiting result') {
    console.log('\u0007');
  }
  console.log(`${new Date().toISOString()} ${user} - ${raw}`);
}

function makeRequestBody(user) {
  let dob = user.dob.split('%2F').join('/');
  return `barcode=${user.barCode}&dob=${dob}`;
}

// todo clean up this mess
function getStatuses(users) {
  return users.map(user => {
    return fetch('https://securelink.labmed.uw.edu/result', {
      headers: {
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'accept-language': 'en-US,en;q=0.9',
        'cache-control': 'max-age=0',
        'content-type': 'application/x-www-form-urlencoded',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
      },
      referrer: 'https://securelink.labmed.uw.edu/?code=BXGJAREQYSHYLSFB',
      referrerPolicy: 'strict-origin-when-cross-origin',
      body: makeRequestBody(user),
      method: 'POST',
      mode: 'cors'
    });
  });
}

function getAll(users) {
  return new Promise((resolve, reject) =>
    Promise.all(getStatuses(users))
      .then(reses => reses.map(res => res.text()))
      .then(bodies => Promise.all(bodies))
      .then(bodies => {
        resolve(bodies.map((body, i) => getStatus(body, users[i].name)));
      })
  );
}

getAll(USERS);

setInterval(() =>getAll(USERS), MINS_BETWEEN_CHECKS * 1000 * 60);
