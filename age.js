// ignore
//@name:「嗅」 age
//@version:1
//@webSite:https://www.ymvid.com/hk
//@remark:
//@order: D
// ignore

// 适用于 把鼠标放在视频封面上 可以右键 复制正确链接的网站
// 不能保证一定能用，不能用的欢迎反馈

/// 是否模拟 PC 是 1， 手机是 0
const isUsePC = 1
/// 默认应该是 0，当视频不能播放的时候，可以把这个设置为 1， 否则不要改动
const isAddReferer = 0

// 网站主页
const webSite = 'https://www.ymvid.com/hk'
// 网站搜索
// https://www.clicli.pro/search/page/2/wd/海.html
// 把网站主页变成 @{webSite} 把搜索词变成 @{searchWord}  把页码变成 @{page}
const searchUrl = '@{webSite}/search/wd/@{searchWord}/page/@{page}.html'
// 当前网站任意视频详情页
// https://www.clicli.pro/bangumi/3384.html
const videoDetailPage = '@{webSite}/hk/play/5035'
// 当前网站任意视频播放页
// https://www.clicli.pro/video/3384/1-1.html
const videoPlayPage = '@{webSite}/hk/play/5035/62464'

// 保持不变
const filterListUrl = ''

const firstClass = [
    {
        name: '粤语',
        // https://www.clicli.pro/show/id/1/page/2.html
        // 把网站主页变成 @{webSite}  把页码变成 @{page}
        id: '@{webSite}/hk/list/@{page}/c1-s0-v0-l0-t0-y0/time_desc',
    },
    
]

// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要
// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要
// 下面这个不要有任何改动，且保持在最后一行，加载内置代码需要

//#BaseCode1#
