
var searchOgretmen = {
    autoComplete_people: {
        initiator: '',
        insert: 'element',
        listEl: function (text) {
            if (text == '') return
            return new Promise(function(res, rej) {
                text = text.replace('@', '')
                text = text.toLowerCase()
                var resultsArray = [];
                var pathToPersonel = 'okullar/petek-koleji/sube-1/sahislar/personel';
                frbsdb.child(pathToPersonel).orderByChild('isim').startAt(text).endAt(text + '\u{f8ff}').limitToFirst(10).once('value', function (snap) {
                    const userUid = snap.val()
                    console.log(snap.val())
                    snap.forEach(function (e) {
                        resultsArray.push('<div style="width: 100%"><a href="#" target="_blank"><div class="el-to-add all-search all-search-user" >'+
                        '<span class="displayName">'+e.val().isim+'</span>'+
                             '<span class="adressName">  '+e.val().email+'</span> </div></div></a></div>');
                        res(resultsArray);
                    })
                }).catch(function (err) {
                    console.log(err)
                })
            })
        },
        action: function (el) {
            el.firstElementChild.click();
        }
    }
}

$(document).on('input change', '#spor-yetki', function(e){
    var argObj = searchOgretmen;
    argObj.e = e;
    argObj.el = e.currentTarget;
    replaceIt(argObj);
});