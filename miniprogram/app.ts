import mta from './lib/mta_analysis';

App<IAppOption>({
  onLaunch(options) {
    mta.App.init({
      appID: '500720672',
      eventID: '500720674',
      autoReport: true,
      statParam: true,
      ignoreParams: [],
      statShareApp: true,
      lauchOpts: options,
    });
  },
});
