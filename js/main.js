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
      var index = 0;
      var length = files.length;
      if (length < 1) return;
      input.disabled = true;
      upload.disabled = true;
      (function upload() {
        var form = new FormData();
        var file = files.shift();
        index++;
        form.append(input.name, file);
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/upload', true);
        xhr.upload.onprogress = function (e) {
          if (e.lengthComputable) {
            var max = length * e.total;
            var current = index * e.total;
            var value = current - e.total + e.loaded;
            progress.max = max;
            progress.value = value;
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
            var name = (new Date).toISOString() + '-' + file.name;
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