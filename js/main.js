document.addEventListener(
  'DOMContentLoaded',
  function () {
    var noSleep = new NoSleep();
    var form = document.querySelector('form');
    var input = form.querySelector('input[type=file]');
    var upload = form.querySelector('input[type=submit]');
    var progress = form.appendChild(document.createElement('progress'));
    var list = document.querySelector('ul');
    progress.max = 1;
    progress.value = 0;
    input.addEventListener('click', function () {
      noSleep.enable();
    });
    input.addEventListener('change', function () {
      form.dispatchEvent(new CustomEvent('submit'));
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var files = [].slice.call(input.files, 0);
      if (files.length < 1) return;
      input.disabled = true;
      upload.disabled = true;
      var loaded = 0;
      var total = (progress.max = files.reduce(
        function (total, file) {
          total += file.size || 0;
          return total;
        },
        0
      ));
      (function upload() {
        var form = new FormData();
        var file = files.shift();
        var adjust = !file.size;
        form.append(input.name, file);
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload', true);
        xhr.upload.onprogress = function (e) {
          if (e.lengthComputable) {
            if (adjust) {
              adjust = false;
              total += e.loaded;
              progress.max = total;
            }
            progress.value = loaded + e.loaded;
          }
        };
        xhr.onabort = xhr.onerror = xhr.onload = function (e) {
          if (!files.length || e.type === 'error') {
            input.value = '';
            progress.max = 1;
            progress.value = 0;
            input.disabled = false;
            upload.disabled = false;
          }
          if (e.type === 'error') {
            alert('Something wrong: ' + (e.message || 'unknown'));
            noSleep.disable();
          } else {
            loaded = parseFloat(progress.value);
            var name = JSON.parse(e.target.getResponseHeader('x-filenames')).shift();
            if (Trashbin.files.indexOf(name) < 0) {
              Trashbin.files.unshift(name);
            }
            list.innerHTML = Trashbin.files.map(function (name) {
              return '<li><a href="/' + name + '" download>' + name + '</a></li>';
            }).join('');
            if (files.length) upload();
            else noSleep.disable();
          }
        };
        xhr.send(form);
      }());
    }, false);
  },
  {once: true}
);