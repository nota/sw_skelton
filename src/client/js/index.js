console.log('hello')




if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js', { scope: '/' }).then(function(reg) {
    // registration worked
    console.log('registration succeeded.', reg);

    var hasExistingActiveWorker = !!reg.active

    var checkForUpdateButton = document.getElementById('check_for_update_btn')
    var updateButton = document.getElementById('update_btn')

    checkForUpdateButton.onclick  = function() {
      // reg.updateはservice workerをアップデートする。
      // もしworkerに変化があれば、updatefoundが呼ばれる。
      // なけれb何も起きない
      // 利用中に、アプリの更新をpush通知などを受け取って、
      // 発火するようにすると、次のリロード時には
      // 新機能が早速使えるようになるので良さそうだ。
      // リロードを2回しなくて良くなるのが利点だ。
      console.log('checking for update...')
      reg.update().then(function () {
        console.log('checking for update... done');
      })
    }

    updateButton.style.display = 'none';
    updateButton.onclick = function() {
      // reg.updateはservice workerをアップデートする。
      // もしworkerに変化があれば、updatefoundが呼ばれる。
      // なけれb何も起きない
      // 利用中に、アプリの更新をpush通知などを受け取って、
      // 発火するようにすると、次のリロード時には
      // 新機能が早速使えるようになるので良さそうだ。
      // リロードを2回しなくて良くなるのが利点だ。
      console.log('update!');
      location.reload();
    }

    reg.addEventListener('updatefound', function() {
      // A new worker is coming!
      console.log('a new worker is coming!', reg)
      if (!hasExistingActiveWorker) {
        console.log('this is the first worker, so do not prompt')
        hasExistingActiveWorker = true
        return
      }

      //location.reload();
      document.getElementById('message').innerHTML = 'there is a new update!';
      updateButton.style.display = 'inline-block';
    });

    reg.addEventListener('controllerchange', function() {
      // A new worker is coming!
      console.log('a new worker is controlling!', reg)
      //location.reload();
      //updateButton.style.display = 'inline-block';
    });
  }).catch(function(error) {
    // registration failed
    console.error('registration failed with ' + error);
  });
};

window.onload = function onLoad () {
  console.log('onLoad')
  var url = location.href;

  document.getElementById('message').innerHTML = url;

}
