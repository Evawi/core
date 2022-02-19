import { UseMock, MockUrl, BaseUrl, RequestHeaderAccept, RequestHeaderContentType } from '../../../conf/main';
import { RequestPropsI } from './Interface';

export class FetchClass {
  _checkUseMock() {
    return UseMock;
  }

  _requestHeader() {
    const requestHeaders: HeadersInit = new Headers();
    if (RequestHeaderContentType) requestHeaders.set('Content-Type', RequestHeaderContentType);
    if (RequestHeaderAccept) requestHeaders.set('Accept', RequestHeaderAccept);
    return requestHeaders;
  }

  async fetch<BodyT, MockT>(requestProps: RequestPropsI<BodyT, MockT>, requestMethod: string): Promise<MockT> {
    let urlParams = requestProps.urlCtr;
    if (requestProps.urlTarget) urlParams += '/' + requestProps.urlTarget;
    if (requestProps.urlSearch) urlParams += '?' + requestProps.urlSearch;
    let method, url, body, headers;
    if (this._checkUseMock()) {
      const requestBodyData = {
        needError: requestProps.needError,
        delay: requestProps.delay,
        mockRequest: requestProps.mockRequest,
        requestBody: requestProps.body
      };
      method = 'POST';
      url = MockUrl + '/mock' + '?urlTarget=' + urlParams;
      body = JSON.stringify(requestBodyData);
      headers = this._requestHeader();
      console.log('_request mock:', method, url, requestBodyData, headers);
    } else {
      method = requestMethod;
      url = BaseUrl + urlParams;
      if (requestProps.body) body = JSON.stringify(requestProps.body);
      headers = this._requestHeader();
      console.log('_request:', method, url, requestProps.body, headers);
    }
    const response = await fetch(url, { method, headers, body });
    const responsebody = await response.json();
    return responsebody;
  }
}
