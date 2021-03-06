import utils from 'blue-utils';
import config from '@config';
import { hideLoading, showLoading } from '$mp-api/loading';
import { showToast } from '$mp-api/toast';
import { pageID } from '$mp-api/page';
//拦截处理
import { responseInterceptor } from './interceptor';

//请求的提醒信息
interface TRequestTips {
	loading?: string;
	fail?: string;
	timeout?: string;
}

//请求类型参数
interface TRequestOpts extends RequestOptions {
	//是否显示loading
	showLoading?: boolean;
	//是否显示toast
	showToast?: boolean;
	//是否使用pageID
	checkPageID?: boolean;
	//请求的提醒
	tips?: TRequestTips;
	//其他参数兼容
	[ param: string ]: any;
}

//在vue扩展
export function requestInVue ( Vue: any ): void {
	//扩展 wx.request,带上登录态处理
	Vue.prototype.$request = request;
}

//设置扩展
function setExtend ( opts: any ): any {
	//原始的url
	opts.rawUrl = opts.url;
	//合并域名
	opts.url = `${opts.baseUrl || config.url.base || ''}${opts.url}`;

	return utils.extend(config.request.options, {
		header: setRequestHeader(),
	}, opts);
}

//设置login header
function setRequestHeader (): any {
	const header: any = {};
	utils.each(config.login.storage, ( key: string, _key: string ) => {
		header[ _key ] = uni.getStorageSync(_key);
	});
	return header;
}

//request 请求封装
export default function request ( this: any, requestOpts: TRequestOpts ): Promise<any> {
	//获取到添加login header options
	requestOpts = setExtend(requestOpts);
	const { tips, showLoading: _showLoading } = requestOpts;
	//是否在app内调用
	const inAppUse = this && this.$mp.app;
	//request loading的处理
	_showLoading && showLoading({
		title: (tips as TRequestTips).loading
	});
	//uni.request ,context看需要执行
	return new Promise(( resolve, reject ) => {
		//获取当前的pageID
		const currentPageID: number = pageID.getCurrentID();
		//require pageID
		const { rawUrl, method, checkPageID } = requestOpts;
		let route: any;
		let blueMpMock: any;
		//只有开发环境存在mock interceptor
		if (process.env.NODE_ENV !== 'production') {
			//项目模拟数据
			blueMpMock = require('@mock');
			//查找模拟拦截器中定义的路由
			route = blueMpMock.findRoute({
				url: rawUrl,
				method
			});
		}

		//模拟数据
		if (process.env.NODE_ENV !== 'production' && route) {
			//关闭loading
			_showLoading && hideLoading();
			//比对当前的页面id，不匹配则不处理
			if ((checkPageID || !inAppUse) && !pageID.isCurrentID(currentPageID)) return;
			const res = blueMpMock.response(route);
			//拦截器
			responseInterceptor({
				res,
				resolve,
				reject,
				requestOpts
			});
		} else {
			//从设置的配置中扩展
			uni.request(utils.extend(requestOpts, {
				success: ( res: any ) => {
					//关闭loading
					_showLoading && hideLoading();
					//比对当前的页面id，不匹配则不处理
					if ((checkPageID || !inAppUse) && !pageID.isCurrentID(currentPageID)) return;
					//拦截器
					responseInterceptor({
						res,
						resolve,
						reject,
						requestOpts
					});
				},
				fail: ( err: any ) => {
					//关闭loading
					_showLoading && hideLoading();
					//比对当前pageID
					if ((checkPageID || !inAppUse) && !pageID.isCurrentID(currentPageID)) return;
					//选取提醒信息
					let msg = (tips as TRequestTips).fail;
					//超时提醒
					if (err && /timeout/.test(err.errMsg)) {
						msg = (tips as TRequestTips).timeout;
					}
					showToast({
						title: msg
					});
					reject(err);
				}
			}));
		}
	});
};
