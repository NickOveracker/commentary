var player1, player2,
    time_update_interval = 0;
	
var dimX = 600;
var dimY = 400;

var switchPoints = [
	{stopAt: 5, switchTo: 0},
	{stopAt: 5, switchTo: 5},
];
var switchIndex = 0;

function getCurrentTime() {
	var currentTime = 0;
	var player = switchIndex % 2 === 0 ? player1 : player2;
	
	if(switchIndex === 0) {
		return player.getCurrentTime();
	}
	else {
		currentTime += switchPoints[0].stopAt;
	}
	
	currentTime += player.getCurrentTime() - switchPoints[switchIndex - 1].switchTo;
	
	// Add each step
	for(var ii = 1; ii < switchIndex; ii++) {
		currentTime += (switchPoints[ii].stopAt - switchPoints[ii-1].switchTo);
	}
	
	return currentTime;
}

function getTotalLength() {
	var totalLength = 0;
	
	// Add each step
	for(var ii = 0; ii < switchPoints.length; ii++) {
		if(ii > 0) {
			totalLength -= switchPoints[ii-1].switchTo;
		}
		totalLength += switchPoints[ii].stopAt;
	}
	
	// Add the remainder of the last video.
	if(switchPoints.length === 0) {
		totalLength = player1.getDuration();
	}
	else if(switchPoints.length % 2 === 0) {
		totalLength += (player1.getDuration() - switchPoints[switchPoints.length - 1].switchTo);
	}
	else {
		totalLength += (player2.getDuration() - switchPoints[switchPoints.length - 1].switchTo);
	}
	
	return totalLength;
}

function onYouTubeIframeAPIReady() {
    player1 = new YT.Player('video1-placeholder', {
        width: dimX,
        height: dimY,
        videoId: 'X1l4duE9s14',
        playerVars: {
            color: 'white',
            playlist: '',
			controls: 0,
			cc_load_policy: 1,
			rel: 0,
			playsinline: 1
        },
        events: {
            onReady: initialize
        }
    });
	
	player2 = new YT.Player('video2-placeholder', {
        width: 1,
        height: 1,
        videoId: 'jJCq5p8HCZo',
        playerVars: {
            color: 'white',
            playlist: '',
			controls: 0,
			rel: 0,
			playsinline: 1
        },
        events: {
            onReady: initialize
        }
    });
}

function initialize(){

    // Update the controls on load
    updateTimerDisplay();
    updateProgressBar();

    // Clear any old interval.
    clearInterval(time_update_interval);

    // Start interval to update elapsed time display and
    // the elapsed part of the progress bar every second.
    time_update_interval = setInterval(function () {
        updateTimerDisplay();
        updateProgressBar();
    }, 500);
	
	
	player1.setOption( "captions" , 'track' , { 'languageCode' : 'en-GB' } );


    $('#volume-input').val(Math.round(player1.getVolume()));
}


// This function is called by initialize()
function updateTimerDisplay(){
    // Update current time text display.
    $('#current-time').text(formatTime( getCurrentTime() ));
    $('#duration').text(formatTime( getTotalLength() ));
}


// This function is called by initialize()
function updateProgressBar(){
    // Update the value of our progress bar accordingly.
    $('#progress-bar').val((getCurrentTime() / getTotalLength()) * 10000);
}


// Progress bar

$('#progress-bar').on('mouseup touchend', function (e) {

    // Calculate the new time for the video.
    // new time in seconds = total duration in seconds * ( value of range input / 10000 )
    var newTime = getTotalLength() * (e.target.value / 10000);

    // Skip video to new time.
	var v1sum = switchPoints[0].stopAt;
	var v2sum = 0;
	var activePlayer = player1;
	var idlingPlayer = player2;
	
	for(var ii = 0; ii < switchPoints.length; ii++) {
		if(ii > 0) {
			if(ii % 2 === 0) {
				v1sum += switchPoints[ii].stopAt - switchPoints[ii-1].switchTo;
			}
			else {
				v2sum += switchPoints[ii].stopAt - switchPoints[ii-1].switchTo;
			}
		}
		
		var diff = v1sum + v2sum - newTime;
		if(diff <= 0)
		{
			idlingPlayer = activePlayer;
			activePlayer = (activePlayer === player1) ? player2 : player1;
		}
		else 
		{
			idlingPlayer.pauseVideo();
			activePlayer.seekTo(switchPoints[ii].stopAt - diff);
			switchIndex = ii;
			idlingPlayer.setSize(0,0);
			activePlayer.setSize(dimX,dimY);
			activePlayer.playVideo();
			return;
		}
	}
	
	if(switchPoints.length % 2 === 0) {
		player2.pauseVideo();
		player1.seekTo(player1.getDuration() - (getTotalLength() - newTime));
		switchIndex = switchPoints.length;
		player2.setSize(0,0);
		player1.setSize(dimX,dimY);
		player1.playVideo();
	}
	else
	{
		player1.pauseVideo();
		player2.seekTo(player2.getDuration() - (getTotalLength() - newTime));
		switchIndex = switchPoints.length;
		player1.setSize(0,0);
		player2.setSize(dimX,dimY);
		player2.playVideo();
	}
});


// Playback

$('#play').on('click', function () {
	player = switchIndex % 2 === 0 ? player1 : player2;
    player.playVideo();
});


$('#pause').on('click', function () {
	player = switchIndex % 2 === 0 ? player1 : player2;
    player.pauseVideo();
});

// Helper Functions

function formatTime(time){
    time = Math.round(time);

    var minutes = Math.floor(time / 60),
        seconds = time - minutes * 60;

    seconds = seconds < 10 ? '0' + seconds : seconds;

    return minutes + ":" + seconds;
}

var timeout = setTimeout(function(){
	var interval = setInterval(function(){
		var activePlayer = (switchIndex % 2 === 0) ? player1 : player2;
		var idlingPlayer = (switchIndex % 2 === 0) ? player2 : player1;
		
		if(switchIndex >= switchPoints.length)
		{
			return;
		}
		
		if(activePlayer.getCurrentTime() >= switchPoints[switchIndex].stopAt){
			activePlayer.pauseVideo();
			idlingPlayer.seekTo(switchPoints[switchIndex].switchTo);
			activePlayer.setSize(0,0);
			idlingPlayer.setSize(dimX,dimY);
			idlingPlayer.playVideo();
			switchIndex++;
			/*
			if(switchIndex >= switchPoints.length)
			{
				clearInterval(interval);
			}
			*/
		}
	},1000);
},switchPoints[0] * 1000);
