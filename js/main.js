document.addEventListener(
  'DOMContentLoaded',
  function () {
    var form = document.querySelector('form');
    var input = form.querySelector('input[type=file]');
    var upload = form.querySelector('input[type=submit]');
    var progress = form.appendChild(document.createElement('progress'));
    var list = document.querySelector('ul');
    progress.max = 1;
    progress.value = 0;
    form.addEventListener('submit', function (e) {
      var files = [].slice.call(input.files, 0);
      if (files.length < 1) return e.preventDefault();
      var form = new FormData();
      files.forEach(function (file) {
        form.append(input.name, file);
      });
      var xhr = new XMLHttpRequest();
      xhr.open('POST', '/upload', true);
      xhr.upload.onprogress = function (e) {
        if (e.lengthComputable) {
          progress.max = e.total;
          progress.value = e.loaded;
        }
      };
      xhr.onabort = xhr.onerror = xhr.onload = function (e) {
        input.value = '';
        progress.max = 1;
        progress.value = 0;
        input.disabled = false;
        upload.disabled = false;
        if (e.type === 'error') {
          alert('Something wrong: ' + (e.message || 'unknown'));
        } else {
          files.forEach(function (file) {
            if (Trashbin.files.indexOf(file.name) < 0) {
              Trashbin.files.unshift(file.name);
            }
          });
          list.innerHTML = Trashbin.files.map(function (name) {
            return '<li><a href="/' + name + '" download>' + name + '</a></li>';
          }).join('');
        }
      };
      xhr.send(form);
      input.disabled = true;
      upload.disabled = true;
      e.preventDefault();
    }, false);
  },
  {once: true}
);