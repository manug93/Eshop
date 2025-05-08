function isJson(body: any): boolean {
  if (typeof body === 'string') {
    try {
      JSON.parse(body);
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function http(
  url: string,
  options: {
    method?: string;
    headers?: HeadersInit;
    body?: any;
    credentials?: RequestCredentials;
  } = {}
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const method = options.method || 'GET';
    
    xhr.open(method, url, true);
    xhr.withCredentials = options.credentials === 'include';

    // Set content type for non-GET requests with body
    const contentType = options.headers instanceof Headers 
      ? options.headers.get('Content-Type')
      : Array.isArray(options.headers)
        ? options.headers.find(([key]) => key.toLowerCase() === 'content-type')?.[1]
        : options.headers?.['content-type'];

    console.log('Original Content-Type:', contentType);
    console.log('Original Headers:', options.headers);

    // Set default content type to application/json for non-GET requests with body
    if (method !== 'GET' && options.body && (!contentType || contentType === null)) {
      xhr.setRequestHeader('Content-Type', 'application/json');
    }

    // Set headers
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (key.toLowerCase() !== 'content-type' || !contentType) {
          xhr.setRequestHeader(key, value);
        }
      });
    }

    xhr.onload = () => {
      const headers = new Headers();
      xhr.getAllResponseHeaders().split('\r\n').filter(Boolean).forEach(line => {
        const [key, value] = line.split(': ');
        headers.append(key, value);
      });

      console.log('Response Headers:');
      headers.forEach((value, key) => console.log(`${key}: ${value}`));

      resolve(new Response(xhr.responseText, {
        status: xhr.status,
        statusText: xhr.statusText,
        headers
      }));
    };

    xhr.onerror = () => reject(new Error('Network error'));
    xhr.ontimeout = () => reject(new Error('Request timeout'));

    // Handle body stringification
    let bodyToSend = options.body;
    if (bodyToSend && contentType === 'application/json' && !isJson(bodyToSend)) {
      bodyToSend = JSON.stringify(bodyToSend);
    }

    xhr.send(bodyToSend);
  });
} 