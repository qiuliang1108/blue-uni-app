import $request from '$request';
import config from '@config';

export function apiLogin(params) {
  const login = config.login;
  return $request({
    url: login.url,
    method: 'post',
    baseUrl: login.baseUrl,
    data: params,
    isShowLoading: false
  });
}