// ==UserScript==
// @name     Abook NZB Helpers
// @version  1
// @match    https://abook.link/book/index.php?topic=*
// @run-at   document-idle
// @noframes
// ==/UserScript==

const nzblnk_icon =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADggGOSHzRgAAAAABJRU5ErkJggg==';

function sanatize_common(code) {
  code = code.replace(
    /(?:abook|kooba)\.*(?:to|link|ws)*\s*(?:-|\||~)*\s*/gi,
    '',
  );
  code = code.replace(/['"|]+/g, '');
  code = code.replace(/\\&+/g, ' ');
  code = code.replace(/\w+: /gi, '');
  code = code.replace(/.par2/gi, '');
  code = code.replace(/ mp3/gi, '');
  code = code.replace(/ jpg/gi, '');
  code = code.replace(/PW -*/gi, '');
  return code.trim();
}

function search_previous(elem) {
  if (!elem) return '';
  if (elem.textContent) return elem;
  return search_previous(elem.previousSibling);
}

function search_next(elem) {
  if (!elem) return '';
  if (elem.textContent) return elem;
  return search_next(elem.nextSibling);
}

function next_text(elem) {
  if (!elem) return '';
  if (elem.nodeName == '#text' || elem.nodeName == 'SPAN') return elem.textContent;
  return next_text(elem.nextSibling);
}

function parse_code(codeItem) {
  const header = search_previous(codeItem.previousSibling);
  const code = search_next(codeItem.nextSibling);
  return [header, code];
}

function inject_nzbdonkey(code, title, search, password, time) {
  const mainDiv = document.createElement('div');
  mainDiv.classList.add('nzbdonkey');
  mainDiv.setAttribute(
    'style',
    'margin-top: 20px; border: 1px dotted yellow; padding: 10px;',
  );

  const help = document.createElement('a');
  help.classList.add('nzbdonkey-help');
  help.setAttribute('target', '_blank');
  help.setAttribute('rel', 'noreferrer');
  help.setAttribute('href', 'https://tensai75.github.io/NZBDonkey/');
  help.setAttribute(
    'title',
    "This extension allows you to right click the text below and click 'Get NZB File' to automatically find and process the NZB.\n\nAnother extension is required.",
  );
  help.setAttribute(
    'style',
    'text-decoration: none; color: #2196f3; border-bottom: 1px dotted #2196f3;',
  );
  help.appendChild(document.createTextNode('?'));

  const headDiv = document.createElement('div');
  headDiv.classList.add('nzbdonkey-head');
  headDiv.appendChild(document.createTextNode('NZBDonkey Highlight Text '));
  headDiv.setAttribute('style', 'font-weight: bold; color: red;');
  headDiv.appendChild(help);
  mainDiv.appendChild(headDiv);

  const textDiv = document.createElement('div');
  textDiv.classList.add('nzbdonkey-text');
  textDiv.setAttribute('onclick', 'window.getSelection().selectAllChildren(this);');
  textDiv.setAttribute('oncontextmenu', 'window.getSelection().selectAllChildren(this);');
  textDiv.setAttribute(
    'style',
    'font-size: 10px; font-weight: normal; font-family: monospace; color: #bb96e0; padding-left: 30px;',
  );

  const titleDiv = document.createElement('div');
  titleDiv.appendChild(document.createTextNode(title));
  textDiv.appendChild(titleDiv);

  const headerDiv = document.createElement('div');
  headerDiv.appendChild(document.createTextNode(`Header: ${search}`));
  textDiv.appendChild(headerDiv);

  if (password) {
    const passwordDiv = document.createElement('div');
    passwordDiv.appendChild(document.createTextNode(`Password: ${password}`));
    textDiv.appendChild(passwordDiv);
  }

  mainDiv.appendChild(textDiv);

  const nzblnkT = encodeURIComponent(title);
  const nzblnkH = encodeURIComponent(search);
  const nzblnkG = encodeURIComponent('alt.binaries.mp3.abooks');
  const nzblnkD = encodeURIComponent(time);
  const nzblnk = document.createElement('a');
  nzblnk.classList.add('nzblnk');

  if (password) {
    const nzblnkP = encodeURIComponent(password);
    nzblnk.setAttribute(
      'href',
      `nzblnk:?t=${nzblnkT}&h=${nzblnkH}&g=${nzblnkG}&p=${nzblnkP}&d=${nzblnkD}`,
    );
  } else {
    nzblnk.setAttribute('href', `nzblnk:?t=${nzblnkT}&h=${nzblnkH}&g=${nzblnkG}&d=${nzblnkD}`);
  }

  const nzblnkIcon = document.createElement('img');
  nzblnkIcon.setAttribute('src', `data:image/png;charset=utf-8;base64,${nzblnk_icon}`);
  nzblnkIcon.setAttribute('border', '0');
  nzblnk.appendChild(nzblnkIcon);
  headDiv.before(nzblnk);
  code.after(mainDiv);
}

function kooba_copy_clipboard_str(str) {
  const el = document.createElement('textarea');
  el.value = str;
  el.setAttribute('readonly', '');
  el.style.position = 'absolute';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

function kooba_copy_clipboard_data(obj) {
  kooba_copy_clipboard_str(obj.dataset.cipboard);

  const iDiv3 = document.createElement('div');
  iDiv3.className = 'copied_to_clipboard';
  iDiv3.style.border = '1px solid red';
  iDiv3.style.backgroundColor = 'red';
  iDiv3.style.color = 'yellow';
  iDiv3.style.textAlign = 'center';
  iDiv3.style.display = 'inline-block';
  iDiv3.style.position = 'absolute';
  iDiv3.style.marginLeft = '10px';
  iDiv3.innerHTML = 'text copied to clipboard';
  obj.parentNode.insertBefore(iDiv3, obj.nextSibling);

  setTimeout(() => {
    const elements = document.getElementsByClassName('copied_to_clipboard');
    while (elements.length > 0) {
      elements[0].parentNode.removeChild(elements[0]);
    }
  }, 2000);
}

function inject_search(code, title, search, password) {
  const searchDiv = document.createElement('div');
  searchDiv.classList.add('search-links');
  searchDiv.setAttribute('style', 'display: inline-block');

  const searchSpan = document.createElement('span');
  searchSpan.setAttribute('style', 'margin-left: .5em');
  searchSpan.appendChild(document.createTextNode('Search:'));
  searchDiv.appendChild(searchSpan);

  const searchLinks = document.createElement('ul');
  searchLinks.setAttribute(
    'style',
    'display: inline-block; list-style: none; margin: 0; padding-left: 0;',
  );

  const query = encodeURIComponent(search);
  const copyText = password ? `${title} {{${password}}}` : title;
  const providers = [
    ['NZBIndex Beta', `https://beta.nzbindex.com/search?q=${query}`],
    ['NZBIndex', `https://nzbindex.com/search?q=${query}`],
    ['Binsearch', `https://www.binsearch.info/search?q=${query}`],
    [
      'NZBKing',
      `https://nzbking.com/search/?q="${query}"&title=${encodeURIComponent(title)}${password ? '&pw=' + encodeURIComponent(password) : ''}`,
    ],
  ];

  providers.forEach(([label, href], index) => {
    const item = document.createElement('li');
    item.setAttribute('style', 'display: inline-block; margin: 0; padding: 0;');

    const link = document.createElement('a');
    link.setAttribute('style', 'margin: 0; padding: 0 .5em;');
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noreferrer');
    link.setAttribute('href', href);
    link.appendChild(document.createTextNode(label));
    link.addEventListener('click', () => {
      kooba_copy_clipboard_str(copyText);
    });

    item.appendChild(link);
    if (index < providers.length - 1) {
      item.appendChild(document.createTextNode('|'));
    }
    searchLinks.appendChild(item);
  });

  searchDiv.appendChild(searchLinks);

  const titlecopyLink = document.createElement('a');
  titlecopyLink.setAttribute(
    'style',
    'margin-left: 30px; color: #9383e0; font-weight: normal;',
  );
  titlecopyLink.addEventListener('click', (e) => kooba_copy_clipboard_data(e.target));
  titlecopyLink.dataset.cipboard = title;
  titlecopyLink.title = `Copy ${title} to clipboard`;
  titlecopyLink.appendChild(document.createTextNode('[Copy Title]'));
  searchDiv.appendChild(titlecopyLink);

  if (password) {
    const titlePwCopyLink = document.createElement('a');
    titlePwCopyLink.setAttribute(
      'style',
      'margin-left: 10px; color: #9383e0; font-weight: normal;',
    );
    titlePwCopyLink.addEventListener('click', (e) => kooba_copy_clipboard_data(e.target));
    titlePwCopyLink.dataset.cipboard = `${title} {{${password}}}`;
    titlePwCopyLink.title = `Copy "${title} {{${password}}}" to clipboard`;
    titlePwCopyLink.appendChild(document.createTextNode('[CopyTitle&PW]'));
    searchDiv.appendChild(titlePwCopyLink);
  }

  code.appendChild(searchDiv);
}

function* post_passwords(postCodes) {
  for (const postCode of postCodes) {
    const code = parse_code(postCode);
    if (code[0].textContent.toLowerCase().includes('password')) {
      yield code[1].textContent;
    } else {
      const next = next_text(postCode.nextSibling);
      if (next.toLowerCase().includes('password')) {
        const rePass = next.match(/:\s*([^\n]+)/);
        if (rePass && rePass[1].trim()) yield rePass[1].trim();
      }
    }
  }
}

function parse_post(postItem) {
  const postTitle = postItem.querySelector('.keyinfo a').text;
  const title = postTitle.replace(/\[SPOT\]/gi, '').trim();
  const postTime = postItem.querySelector('.keyinfo .smalltext').textContent;
  const reTime = /:\s(.+) »/;
  let postTimestamp = Math.round(Date.parse(postTime.match(reTime)[1]) / 1000);
  if (!postTimestamp) postTimestamp = Math.round(Date.now() / 1000);
  console.log('Found post: ', title);
  console.log('Timestamp: ', postTimestamp);

  const postCodes = postItem.querySelectorAll('.codeheader');
  const postPasswords = Array.from(post_passwords(postCodes));

  for (const postCode of postCodes) {
    const code = parse_code(postCode);
    if (!code[0].textContent.toLowerCase().includes('password')) {
      const new_pw = postPasswords.pop();
      const password = new_pw || '';
      const search = sanatize_common(code[1].textContent);
      if (!postCode.classList.contains('code-injected')) {
        inject_nzbdonkey(code[1], title, search, password, postTimestamp);
        inject_search(postCode, title, search, password);
        postCode.classList.add('code-injected');
      }
    }
  }
}

function process_posts() {
  const postItems = document.querySelectorAll('.postarea');
  postItems.forEach((postItem) => {
    parse_post(postItem);
  });
}

(() => {
  process_posts();
  const myThanks = {
    apply: function (target, thisArg, argumentsList) {
      setTimeout(process_posts, 200);
      setTimeout(process_posts, 1200);
      return Reflect.apply(target, thisArg, argumentsList);
    },
  };
  const proxyThanks = new Proxy(saythanks.prototype.init, myThanks);
  saythanks.prototype.init = proxyThanks;
})();
