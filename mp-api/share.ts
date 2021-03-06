import config from '@config';
import utils from 'blue-utils';
import { getCurrentPath } from '$mp-api/page';
import { blackListFilter } from '$assets/js/black-list';

export function shareInVue ( Vue: any ): void {
	//分享地址生成
	Vue.prototype.$sharePath = sharePath;

	//默认的分享，有需要的在自己的实例中使用onShareAppMessage
	Vue.mixin({
		onShareAppMessage () {
			const share = {
				title: config.share.title,
				imageUrl: config.share.imgUrl,
				//分享走最后的path
				path: sharePath()
			};
			console.log(`分享参数:`, share);
			return share;
		}
	});
}

//分享地址
export function sharePath ( path?: string ): string {
	//小程序路由地址
	const currentPath: string = path || getCurrentPath();
	//没参数地址
	const _path: string = utils.getNoParamsLink(currentPath);
	//object params
	const objQuery: any = utils.parseParams(utils.getLinkParams(currentPath));
	//带入忽略参数地址
	const sharePath: string = blackListFilter({
		path: _path,
		blackList: config.share.blackList
	});
	//返回链接
	const query: any = utils.stringifyParams(objQuery);
	return `${sharePath}${query ? `?${encodeURIComponent(query)}` : ''}`;
}



