let interceptor = (async function() {
  let load = Promise.resolve();
  [
    '/gen/layout_test_data/mojo/public/js/mojo_bindings.js',
    '/gen/mojo/public/mojom/base/string16.mojom.js',
    '/gen/mojo/public/mojom/base/time.mojom.js',
    '/gen/third_party/blink/public/mojom/sms/sms_manager.mojom.js',
  ].forEach(path => {
    let script = document.createElement('script');
    script.src = path;
    script.async = false;
    load = load.then(() => new Promise(resolve => {
      script.onload = resolve;
    }));
    document.head.appendChild(script);
  });

  return load.then(intercept);
})();


class SmsProvider {
  getNextMessage(threshold) {
    return this.handler.getNextMessage(threshold);
  }
  setHandler(handler) {
    this.handler = handler;
    return this;
  }
  setBinding(binding) {
    this.binding = binding;
    return this;
  }
  close() {
    this.binding.close();
  }
}

function getNextMessage(threshold, callback) {
  throw new Error("expected to be overriden by tests");
}

async function close() {
  interceptor.then(result => result.close());
}

function expect(call) {
  return {
    andReturn(callback) {
      let handler = {};
      handler[call.name] = callback;
      interceptor.then(result => result.setHandler(handler));
    }
  }
}

async function replay() {
  await interceptor;
}

const Status = {};

function intercept() {
  let result = new SmsProvider();

  let binding = new mojo.Binding(blink.mojom.SmsManager, result);
  let interceptor = new MojoInterfaceInterceptor(blink.mojom.SmsManager.name);
  interceptor.oninterfacerequest = (e) => {
    binding.bind(e.handle);
  }

  interceptor.start();

  result.setBinding(binding);

  Status.kSuccess = blink.mojom.SMSStatus.kSuccess;
  Status.kTimeout = blink.mojom.SMSStatus.kTimeout;

  return result;
}
