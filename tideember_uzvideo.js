// tideember.cc uzVideo source - DEBUG版
// 此版本包含调试信息，帮助定位选择器问题
// Based on: https://tideember.cc
// Source name: tideember

const webSite = 'https://tideember.cc';

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
};

// =====================
// 调试工具：打印返回的HTML结构关键部分
// =====================
function debugHtmlStructure(proData) {
    const $ = cheerio.load(proData);
    console.log('=== HTML Structure Debug ===');
    
    // 尝试查找所有可能的视频容器
    const selectors = [
        '.stui-vodlist__box',
        '.article-block', 
        '.video-item',
        '.vod-item',
        '.movie-item',
        '.top-list',
        '.container .list'
    ];
    
    selectors.forEach(sel => {
        const count = $(sel).length;
        if (count > 0) {
            console.log(`找到 ${count} 个: ${sel}`);
            // 显示第一个的前几行HTML
            const first = $(sel).first();
            console.log(`  示例HTML: ${first.html() ? first.html().substring(0, 200) : '无'}...`);
        }
    });
    
    // 查找所有链接
    const links = $('a');
    console.log(`总链接数: ${links.length}`);
    
    // 查找所有标题
    const titles = $('h1, h2, h3, h4, .title, .name');
    console.log(`标题元素数: ${titles.length}`);
    
    console.log('=== End Debug ===\n');
}

// =====================
// 获取分类列表
// =====================
async function getClassList(args) {
    var backData = { list: [], error: '' };
    try {
        const pro = await req(webSite, { headers: headers });
        const proData = pro.data;
        if (proData) {
            debugHtmlStructure(proData);  // 添加调试
            
            // 尝试多种选择器查找分类
            let categories = [];
            
            // 尝试1：默认 StuVir 结构
            let temp = $('.stui-header__menu li a');
            if (temp.length > 0) {
                temp.each((i, e) => {
                    const cat = $(e);
                    const name = cat.text().trim();
                    const url = cat.attr('href');
                    if (name && url) {
                        categories.push({ type_id: url.replace('/list/', '').replace('.html', ''), type_name: name });
                    }
                });
            }
            
            // 尝试2：如果没找到，尝试其他结构
            if (categories.length === 0) {
                temp = $('.nav-menu a, .top-nav a, .header-nav a');
                temp.each((i, e) => {
                    const cat = $(e);
                    const name = cat.text().trim();
                    const url = cat.attr('href');
                    if (name && url && !url.includes('search')) {
                        categories.push({ type_id: url.replace('/list/', '').replace('.html', ''), type_name: name });
                    }
                });
            }
            
            backData.list = categories;
            if (categories.length === 0) backData.error = '未找到分类，请检查网页结构';
        }
    } catch (e) {
        backData.error = e.message;
    }
    return JSON.stringify(backData);
}

// =====================
// 获取视频列表 - 支持多种选择器
// =====================
async function getVideoList(args) {
    let backData = { list: [], error: '' };
    try {
        const listUrl = webSite + `/list/${args.url}_${args.page}.html`;
        const pro = await req(listUrl, { headers: headers });
        const proData = pro.data;
        if (proData) {
            debugHtmlStructure(proData);
            
            let list = [];
            
            // 尝试多种视频容器选择器
            const containerSelectors = [
                '.stui-vodlist__box',
                '.article-block', 
                '.video-item',
                '.item .name a',
                '.vod-item',
                '.movie-list .item'
            ];
            
            let videoContainers = [];
            
            for (const sel of containerSelectors) {
                const found = $(sel);
                if (found.length > 0) {
                    videoContainers = found;
                    console.log(`使用选择器: ${sel}, 找到 ${found.length} 个`);
                    break;
                }
            }
            
            if (videoContainers.length === 0) {
                // 备选：查找所有可能的列表项
                videoContainers = $('li, .row > div, .col-md-4, .col-sm-6');
            }
            
            videoContainers.each((i, e) => {
                const v = $(e);
                
                // 尝试多种方式获取链接和标题
                let url = '', name = '', pic = '';
                
                // 尝试多种链接获取方式
                const linkCandidates = v.find('a'), v.find('h3 a'), v.find('.name a'), v.find('a.href');
                linkCandidates.each((j, a) => {
                    const candidate = $(a).attr('href');
                    if (candidate && !candidate.includes('search') && !candidate.includes('home')) {
                        url = candidate;
                        return false; // break
                    }
                });
                
                if (!url) url = v.find('a').attr('href') || '';
                
                // 尝试多种标题获取方式
                name = v.find('a').attr('title') 
                    || v.find('h3').text() 
                    || v.find('.name').text() 
                    || v.find('.title').text() 
                    || '';
                
                // 尝试多种封面获取方式
                pic = v.find('a img').attr('data-original') 
                    || v.find('img').attr('src') 
                    || v.find('img').attr('data-lazy') 
                    || '';
                
                if (url && name) {
                    list.push({ vod_id: url, vod_name: name, vod_pic: pic });
                }
            });
            
            backData.list = list;
            if (list.length === 0) backData.error = '未找到视频，选择器可能不匹配';
        }
    } catch (e) {
        backData.error = e.message;
    }
    return JSON.stringify(backData);
}

// =====================
// 获取视频详情
// =====================
async function getVideoDetail(args) {
    let backData = { detail: {}, error: '' };
    try {
        const detailUrl = webSite + args.url;
        const pro = await req(detailUrl, { headers: headers });
        const proData = pro.data;
        if (proData) {
            debugHtmlStructure(proData);
            
            let detail = {};
            
            // 尝试获取标题 - 多种方式
            let title = '';
            const titleSelectors = [
                '.stui-vodlist__title h1',
                '.article .title', 
                '.video-name',
                '.hd h1',
                'h1',
                '.name'
            ];
            for (const sel of titleSelectors) {
                const t = $(sel).first().text().trim();
                if (t) { title = t; break; }
            }
            
            // 封面
            let pic = '';
            const picCandidates = [
                $('.stui-vodlist__thumb img').attr('data-original'),
                $('.article img').attr('data-original'),
                $('meta[property=og:image]').attr('content'),
                'meta[name=twitter:image]').attr('content')
            ];
            for (const p of picCandidates) {
                if (p) { pic = p; break; }
            }
            
            // 年份、地区、语言
            let year = '', area = '', lang = '';
            const infoItems = $('.stui-info__item, .vod-info .item');
            infoItems.each((i, e) => {
                const txt = $(e).text().trim();
                const label = $(e).prev('label').text().trim().toLowerCase() || '';
                if (label.includes('年') || label.includes('year')) year = txt;
                else if (label.includes('地区') || label.includes('area')) area = txt;
                else if (label.includes('语言') || label.includes('lang')) lang = txt;
            });
            // 备选：如果没找到标签，按顺序提取
            if (!year || !area || !lang) {
                const allText = infoItems.map((i, e) => $(e).text().trim()).get();
                if (!year && allText[0]) year = allText[0];
                if (!area && allText[1]) area = allText[1];
                if (!lang && allText[2]) lang = allText[2];
            }
            
            // 获取播放链接
            let playUrls = [];
            const playlist = $('.stui-content__playlist, .play-list, .panel-body');
            if (playlist.length > 0) {
                playlist.find('li a, .link').each((i, e) => {
                    const name = $(e).text().trim();
                    const url = $(e).attr('href');
                    if (name && url) playUrls.push(`${name}|${url}`);
                });
            }
            
            // 备选：从页面脚本中提取
            if (playUrls.length === 0) {
                const scripts = $('script').map((i, e) => $(e).text()).get();
                for (const script of scripts) {
                    // 尝试提取播放URL模式
                    const matches = script.match(/playUrl.*?["']([^"']+)["']/g);
                    if (matches) {
                        matches.forEach(m => {
                            const urlMatch = m.match(/["']([^"']+)["']$/);
                            if (urlMatch) playUrls.push(urlMatch[1]);
                        });
                    }
                }
            }
            
            detail = {
                vod_name: title,
                vod_pic: pic,
                vod_year: year,
                vod_area: area,
                vod_lang: lang,
                vod_play_url: playUrls.join('$$$')
            };
            
            backData.detail = detail;
            if (Object.keys(detail).length === 0) backData.error = '详情页数据为空';
        }
    } catch (e) {
        backData.error = e.message;
    }
    return JSON.stringify(backData);
}

// =====================
// 获取播放地址
// =====================
async function getVideoPlayUrl(args) {
    let backData = { data: '', error: '' };
    try {
        const playUrl = webSite + args.url;
        const pro = await req(playUrl, { headers: headers });
        const proData = pro.data;
        if (proData) {
            const $ = cheerio.load(proData);
            
            // 尝试1：提取 iframe
            const iframe = $('iframe').attr('src');
            if (iframe) {
                backData.data = iframe;
                return JSON.stringify(backData);
            }
            
            // 尝试2：从脚本中提取 vid
            const script = $('script').first().text() || '';
            const vidMatch = script.match(/vid\s*=\s*"([^"]+)"/);
            if (vidMatch) {
                backData.data = `${webSite}/play/${vidMatch[1]}`;
                return JSON.stringify(backData);
            }
            
            // 尝试3：从 href 中提取
            const links = $('a[href*="play"], a[href*="vod"], a[href*="mp4"]');
            if (links.length > 0) {
                const firstLink = $(links[0]).attr('href');
                if (firstLink) {
                    backData.data = firstIndex.includes('http') ? firstLink : `${webSite}${firstLink}`;
                    return JSON.stringify(backData);
                }
            }
            
            // 尝试4：返回原播放页URL
            backData.data = playUrl;
        }
    } catch (e) {
        backData.error = e.message;
    }
    return JSON.stringify(backData);
}

// =====================
// 搜索视频
// =====================
async function searchVideo(args) {
    let backData = { list: [], error: '' };
    try {
        const searchUrl = `${webSite}/search/?q=${encodeURIComponent(args.searchWord)}`;
        const pro = await req(searchUrl, { headers: headers });
        const proData = pro.data;
        if (proData) {
            const $ = cheerio.load(proData);
            
            let list = [];
            
            // 尝试多种搜索结果选择器
            const selectors = ['.article-block', '.search-result', '.video-item', '.result-box', '.item'];
            let videos = [];
            
            for (const sel of selectors) {
                const found = $(sel);
                if (found.length > 0) {
                    videos = found;
                    break;
                }
            }
            
            videos.each((i, e) => {
                const a = $(e).find('a') || $(e);
                const url = a.attr('href') || '';
                const name = a.text().trim() || a.attr('title') || '';
                if (url && name) {
                    list.push({ vod_id: url, vod_name: name });
                }
            });
            
            backData.list = list;
            if (list.length === 0) backData.error = '搜索无结果，选择器可能不匹配';
        }
    } catch (e) {
        backData.error = e.message;
    }
    return JSON.stringify(backData);
}
