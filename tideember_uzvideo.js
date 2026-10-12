// tideember.cc uzVideo source
// Based on: https://tideember.cc
// Source name: tideember

const webSite = 'https://tideember.cc';

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
};

// 分类列表
async function getClassList(args) {
    var backData = { list: [], error: '' };
    try {
        const pro = await req(webSite, { headers: headers });
        const proData = pro.data;
        if (proData) {
            const $ = cheerio.load(proData);
            // 解析分类菜单
            const categories = $('.stui-header__menu li a');
            const list = [];
            categories.each((i, e) => {
                const cat = $(e);
                const name = cat.text().trim();
                const url = cat.attr('href');
                if (name && url) {
                    list.push({
                        type_id: url.replace('/list/', '').replace('.html', ''),
                        type_name: name
                    });
                }
            });
            backData.list = list;
        }
    } catch (e) {
        backData.error = e.message;
    }
    return JSON.stringify(backData);
}

// 获取视频列表
async function getVideoList(args) {
    let backData = { list: [], error: '' };
    try {
        const listUrl = webSite + `/list/${args.url}_${args.page}.html`;
        const pro = await req(listUrl, { headers: headers });
        const proData = pro.data;
        if (proData) {
            const $ = cheerio.load(proData);
            const videos = $('.stui-vodlist__box');
            const list = [];
            videos.each((i, e) => {
                const v = $(e);
                const url = v.find('a').attr('href') || '';
                const name = v.find('a').attr('title') || v.find('h3').text() || '';
                const pic = v.find('a img').attr('data-original') || '';
                list.push({
                    vod_id: url,
                    vod_name: name,
                    vod_pic: pic
                });
            });
            backData.list = list;
        }
    } catch (e) {
        backData.error = e.message;
    }
    return JSON.stringify(backData);
}

// 获取视频详情
async function getVideoDetail(args) {
    let backData = { detail: {}, error: '' };
    try {
        const detailUrl = webSite + args.url;
        const pro = await req(detailUrl, { headers: headers });
        const proData = pro.data;
        if (proData) {
            const $ = cheerio.load(proData);
            const title = $('.stui-vodlist__title h1').text() || '';
            const pic = $('.stui-vodlist__thumb img').attr('data-original') || '';
            const year = $('.stui-info__item.year').text() || '';
            const area = $('.stui-info__item.area').text() || '';
            const lang = $('.stui-info__item.lang').text() || '';
            
            // 获取播放链接
            const playlist = $('.stui-content__playlist');
            const playUrls = [];
            playlist.find('li a').each((i, e) => {
                const name = $(e).text().trim();
                const url = $(e).attr('href');
                if (name && url) {
                    playUrls.push(`${name}|${url}`);
                }
            });
            
            backData.detail = {
                vod_name: title,
                vod_pic: pic,
                vod_year: year,
                vod_area: area,
                vod_lang: lang,
                vod_play_url: playUrls.join('$$$')
            };
        }
    } catch (e) {
        backData.error = e.message;
    }
    return JSON.stringify(backData);
}

// 获取播放地址
async function getVideoPlayUrl(args) {
    let backData = { data: '', error: '' };
    try {
        const playUrl = webSite + args.url;
        const pro = await req(playUrl, { headers: headers });
        const proData = pro.data;
        if (proData) {
            const $ = cheerio.load(proData);
            // 尝试从页面提取 m3u8 URL 或直接返回页面 URL
            const iframe = $('iframe').attr('src');
            if (iframe) {
                backData.data = iframe;
            } else {
                // 尝试提取视频播放地址
                const script = $('script').first().text() || '';
                const vidMatch = script.match(/vid\s*=\s*"([^"]+)"/);
                if (vidMatch) {
                    backData.data = `${webSite}/play/${vidMatch[1]}`;
                } else {
                    backData.data = playUrl;
                }
            }
        }
    } catch (e) {
        backData.error = e.message;
    }
    return JSON.stringify(backData);
}

// 搜索视频
async function searchVideo(args) {
    let backData = { list: [], error: '' };
    try {
        const searchUrl = `${webSite}/search/?q=${encodeURIComponent(args.searchWord)}`;
        const pro = await req(searchUrl, { headers: headers });
        const proData = pro.data;
        if (proData) {
            const $ = cheerio.load(proData);
            const videos = $('.article-block .name a');
            const list = [];
            videos.each((i, e) => {
                const a = $(e);
                const url = a.attr('href') || '';
                const name = a.text().trim() || '';
                if (name && url) {
                    list.push({
                        vod_id: url,
                        vod_name: name
                    });
                }
            });
            backData.list = list;
        }
    } catch (e) {
        backData.error = e.message;
    }
    return JSON.stringify(backData);
}