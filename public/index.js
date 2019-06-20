/* 
things to change/update: 
  1. add a chatbot
  2. add channels
  3. save messages to DB to show on login
*/
$(function () {
  var socket = io();
  var agent = navigator.userAgent.match(/Android|iPhone|iPad|iPod|BlackBerry|Opera Mini|IEMobile|WPDesktop/i);
  var myName, myColor, myPhoto;
  
  agent ? $('#input').css('padding', 2): null;
  
  $('#contain').fadeIn(1000);
  $('#m').focus();
  
  $('#input').submit(function(e){
    e.preventDefault();
    var msg = $('#m').val().trim();
    if (msg === '') {return false;};
    socket.emit('chat message', msg);
    $('#m').val('');
    maker(myColor,true,myName,new Date(),msg,false,myPhoto);
    scroll(false);
    return false;
  });
  $('#privateMsg').submit(function(e){
    e.preventDefault();
    var msg = $('#pm').val().trim();
    var name = $('#name').html().trim();
    socket.emit('private message', msg, name);
    $('#pm').val('');
    $('#result').text('Message Sent').fadeIn(500).delay(2000).fadeOut(500);
    return false;
  });
  socket.on('myInfo', function(data){
    myName = data.name, myColor = data.color, myPhoto = data.photo;
  });
  socket.on('new user', function(data){
    var res = '<span><strong style="color: '+data.color+'">'+data.name+'</strong> joined.</span>';
    $('#displayUserBottom').html(res);
    $('#displayBottom').fadeIn(500).delay(2000).fadeOut(500);
  });
  socket.on('count', function(data){
    $('#num').text(data.count)
  });
  socket.on('users', function(data){
    var arr = [];
    data.users.forEach(x => {
      var res;
      arr.length > 0 ? res = $('<span>,<strong style="color: '+x.color+'"> '+x.username+'</strong></span>').click(privateM): 
        res = $('<span><strong style="color: '+x.color+'"> '+x.username+'</strong></span>').click(privateM);
      arr.push(res);
    })
    $('#users').html(arr);
  });
  socket.on('typing', function(data){
    var res = '<span><strong style="color: '+data.color+'">'+data.name+'</strong> is typing...</span>';
    $('#displayBottom').html(res).fadeIn(500);
  });
	  
  socket.on('not typing', function(data){
    $('#displayBottom').fadeOut(500);
  });    
     
  socket.on('chat message', function(data){
    maker(data.color,false,data.name,new Date(),data.msg,false,data.photo);
    scroll(false);
  });
  
  socket.on('private message', function(data){
    maker(data.color,false,data.name,new Date(),data.msg,true,data.photo);
    scroll(false);
  });
      
  socket.on('disconnect', function(data){
    var res = '<span><strong style="color: '+data.color+'">'+data.name+'</strong> left.</span>';
    $('#displayUserBottom').html(res);
    $('#displayBottom').fadeIn(500).delay(2000).fadeOut(500);
    $('#num').text(data.count)
  });
	  
  $("#m").keyup(function(e)  {
    if (e.keyCode !== 13)  {
      typingUser();
    } else {
      typing = false;
      socket.emit('not typing');
    }
  });
   
  /* typing, message, and time functions */
  var typing = false;
  var timeout = undefined;
  function timeoutFunction(){
    typing = false;
    socket.emit('not typing');
  };
  function typingUser(){
    if (typing == false) {
      typing = true;
      socket.emit('typing');
      clearTimeout(timeout);
      timeout = setTimeout(timeoutFunction, 2000);
    } else {
      clearTimeout(timeout);
      timeout = setTimeout(timeoutFunction, 2000);
    };
  };
  function maker(color,line,name,date,message,pm,photo) {
    var cont = $('<div>').attr('class','message'),
        row = $('<div>').attr('class','row'),
        col1 = $('<div>').attr('class','col1'),
        col2 = $('<div>').attr('class','col2'),
        img = $('<img>').attr('class','img').attr('src',photo),
        out = $('<span>').click(privateM),
        strn = $('<strong>').css('color', color).text(name),
        span = $('<span>').attr('class','date').text(` - ${time(date)}`),
        btn = $('<button>').attr('class','float-right').html('&#8942;').click(profile),
        para = $('<p>').text(message);
    if (pm) { cont.addClass('pm'); }
    if (self) { cont.addClass('self'); }
    col1.append(img);
    out.append(strn);
    col2.append(out).append(span).append(btn).append(para);
    row.append(col1).append(col2);
    cont.append(row);
    $('#messages').append(cont);
    height();
  };
  function time(d) {
    var local = d.toLocaleTimeString();
    var i = local.indexOf(' ');
    var res = local.replace(local.substring(i-3,i),'');
    return res;
  };
  
  /* private message modal */
  function privateM(e) {
    e.preventDefault();
    var name = $(this).children().html();
    $('#name').text(name);
    $('#myModal').css('display', 'block');
    $('#pm').focus();
  };
  window.onclick = function(e) { 
    if (e.target === $('#myModal')[0]) {
      $('#myModal').css('display', 'none');
    };
  };
  
  /* profile */
  function profile(e) {
    e.preventDefault();
    var name = $(this).parent().prev().prev().prev().html();
    alert('Coming Soon')
  };
  
  /* mobile nav */
  var border = true;
  $('.nav').click(function(){
    border ? $('#displayTop').css('border-bottom','none'): $('#displayTop').css('border-bottom','2px solid gray')
    $('#displayOnline').toggle(()=>{ 
      border = !border;
      height();
    });
  });
  
  /* #messages height */
  function height() {
    var doc = $(document).height();
    var top = $('#displayTop').outerHeight() + $('#displayOnline').outerHeight();
    var bot = $('#input').outerHeight();
    var total = doc - (top + bot) - 25;
    $(document).width() < 400 ? border ? total = doc - (top + bot) - 4: total = doc - (top + bot) - 24: null;
    $('#messages').css({'min-height': total, 'max-height': total, 'overflow-y': 'scroll', 'border-bottom': '2px solid black'});
  };
  
  /* scrolling */
  function scroll(val) {
    var mess = $('#messages');
    var box = mess.height(); // height of container
    var total = mess.prop('scrollHeight'); // height of total content
    var hidden = total - box; // height of hidden content
    if (val) { 
      mess.animate({ scrollTop: hidden }, 1000); 
      $('#below').fadeOut(500);
    } else {
      var locat = mess.scrollTop();
      hidden - locat > 200 ? messageBelow(): mess.animate({ scrollTop: hidden }, 500);
    };
  };
  
  function messageBelow() {
    $('#below').css('width', detectMobile ).click(scroll).html('&darr; &#09;&#09; new messages below &#09;&#09; &darr;').hover(function() {
  $(this).css('cursor','default')}).fadeIn(500);
    $('#messages').scroll(function(){
      $(this).prop('scrollHeight') - $(this).height() - $(this).scrollTop() < 77 ? $('#below').fadeOut(500): null;
    });
  };
  
  function detectMobile() {
    if (agent) { return '100%' } 
    else { return 'calc(100% - 17px)' }
  };
});