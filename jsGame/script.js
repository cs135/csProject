var canvas	= document.getElementById('myCanvas');
var context	= canvas.getContext('2d');
var map = new Map();

//tick = 1000 divided by frames per second
var tick		= 1000 / 60;
var tickCount	= 0;

//Player vars
var playerAccel		= 2;
var playerMaxSpeed	= 2;
var invincibleTime = 30;

//Bullet vars
var bulletSpeed		= 15;
var fireDelay		= 10;
var timesShot		= 0;
var shot			= [];

//Enemy vars
var spawnInterval = 120;
var numEnemies = 0;
var enemy = [];
var enemyBaseSpeed = 3;
var enemyBaseAccel = 0.25;

//Control key codes
var W = 87;
var A = 65;
var S = 83;
var D = 68;

//Color codes
var BLACK = "#000000";
var RED = "#FF0000";
var BLUE = "#60A7EE"; //for the Freeze powerup

//Control flags
var mousePos	= [2];
var keyPressed	= [ ];
var mouseDown;
var mouseTick;

//Player initialization
var player	= new Player();
player.x	= map.w  / 2;
player.y	= map.h / 2;

//Game Update
setInterval (function () {update ()}, tick);
function update() {	
	//Frame initialization
	map.draw();
	map.drawHUD();
	
	if (player.isDead) {
		endGame();
		return;
	}
	
	tickCount++;
	
	if (!player.isDead) {
		if (mouseDown) {
			if (mouseTick % fireDelay == 0) {
					player.shoot();
			}
			mouseTick++;
		}
	}
	
	//Player control
	if (!player.isDead) {
		player.input();
		player.hitTest();
		player.move();
		player.decelerate();
		player.draw();
	}
	
	//Enemy control
	for (var i = 1; i < numEnemies; i++) {
		if (!enemy[i].isDead) {
			enemy[i].findPlayer();
			enemy[i].move();
			enemy[i].draw();
		}
	}
	
	//Bullet control. For each bullet i
	for (var i = 1; i <= timesShot; i++) {
		if (!shot[i].isDestroyed){
			shot[i].move();
			shot[i].draw();
			shot[i].hitTest();
		}
	}
	
	//Spawn enemies
	if (tickCount % spawnInterval == 0) {
		console.log("Enemy Spawned");
		console.log("Ticks until next spawn:", spawnInterval, "(", spawnInterval / 60, "seconds)");
		numEnemies++;
		spawnInterval--;
		if (spawnInterval < 10) 
			spawnInterval = 10;
		enemy[numEnemies] = new Enemy(1);
	}
	
}

/*
	Enemy object
	Three types: Normal, Strong, Fast
		1 - Normal
			Normal speed
			3 hp
		2 - Strong
			Slower speed
			5 hp
		3 - Fast
			Very fast
			1 hp
	(player's speed is 2)
*/

function randomInt(min, max) {
		return Math.floor(Math.random() * (max - min)) + min;
}

function Enemy(type) {
	this.type = type;
	this.health;
	this.x;
	this.y;
	this.xvel = 0;
	this.yvel = 0;
	this.maxSpd;
	this.accel;
	this.isDead = false;
	this.audio = new Audio('sounds/hitsound.wav');
	
	if (this.type == 1) {
		this.maxSpd = enemyBaseSpeed;
		this.health = 3;
		this.accel = enemyBaseAccel;
	}

 	if (Math.random() > .5) {
 		this.x = player.x + randomInt(400,800);
 	} else {
 		this.x = player.x - randomInt(400,800);
 	}
 	if (Math.random() > .5) {
 		this.y = player.y + randomInt(400,800);
 	} else {
 		this.y = player.y - randomInt(400,800);
 	}
	
	this.draw = function() {
		context.beginPath();
		context.rect(this.x - 5, this.y, 10, 15);
		context.arc(this.x, this.y, 5, 0, 2 * Math.PI);
		context.closePath();
		context.fillStyle = RED;
		context.fill();
	};
	
	this.findPlayer = function() {
	
		if (this.y > player.y) {
			if (this.yvel >= -this.maxSpd) {
				this.yvel -= this.accel;
			}
		}
		if (this.y < player.y) {
			if (this.yvel <= this.maxSpd) {
				this.yvel += this.accel;
			}
		}
		if (this.x > player.x) {
			if (this.xvel >= -this.maxSpd) {
				this.xvel -= this.accel;
			}
		}
		if (this.x < player.x) {
			if (this.xvel <= this.maxSpd) {
				this.xvel += this.accel;
			}
		}
	};
	
	this.takeDamage = function() {
		this.health--;
		this.audio.play();
		if (this.health <= 0) {
			this.x = -10;
			this.isDead = true;
		}
	};
	
	this.move = function() {
		if (!this.isDead) {
		//move player according to final velocity 
			this.x += this.xvel;
			this.y += this.yvel;
		}
	};
}

/*
	player object
*/
function Freeze() {
	this.x;
	this.y;
	
	this.draw = function() {
		context.beginPath();
		context.closePath();
		context.fillStyle = BLUE;
		context.fill();
	}
}

function Player() {
	this.x;
	this.y;
	this.xvel = 0;
	this.yvel = 0;
	this.isDead = false;
	this.health = 3;
	this.damageTick = 0;
	
	this.input = function() {
		//key processing
		if (keyPressed[W]) {
			if (this.yvel >= -playerMaxSpeed) {
				this.yvel -= playerAccel;
			}
		}
		if (keyPressed[S]) {
			if (this.yvel <= playerMaxSpeed) {
				this.yvel += playerAccel;
			}
		}
		if (keyPressed[A]) {
			if (this.xvel >= -playerMaxSpeed) {
				this.xvel -= playerAccel;
			}
		}
		if (keyPressed[D]) {
			if (this.xvel <= playerMaxSpeed) {
				this.xvel += playerAccel;
			}
		}
	};
	
	this.takeDamage = function() {
		if (tickCount > this.damageTick + invincibleTime) {
			this.damageTick = tickCount;
			this.health--;
			if (this.health <= 0) {
				this.isDead = true;
			}
			
		}
	};
	
	//checks for collisions
	this.hitTest = function() {
		this.hitTop		= this.y - 5;
		this.hitBot		= this.y + 15;
		this.hitLeft	= this.x - 10;
		this.hitRight	= this.x + 10;
		
		if (this.hitLeft <= 0) {
			this.xvel += 2;
			this.x = 10;
		}
		if (this.hitRight >= map.w) {
			this.xvel -= 2;
			this.x = map.w - 10;
		}
		if (this.hitTop <= 0) {
			this.yvel += 2;
			this.y = 10;
		}
		if (this.hitBot >= map.h) {
			this.yvel -= 2;
			this.y = map.h -20;
		}
		
		for (var i = 1; i < numEnemies; i++) {
			if (
				this.hitLeft <= enemy[i].x + 10
				&& this.hitRight >= enemy[i].x - 10
				&& this.hitTop <= enemy[i].y + 15
				&& this.hitBot >= enemy[i].y -5
				)
			{
				this.takeDamage();
			}
		}
	};
	
	this.move = function() {
		//move player according to final velocity 
		this.x += this.xvel;
		this.y += this.yvel;
	};
		
	this.decelerate = function() {
		if (this.xvel < 0) {
			this.xvel += 1;
		} else if (this.xvel > 0) {
			this.xvel -= 1;
		}
		if (this.yvel < 0) {
			this.yvel += 1;
		} else if (this.yvel > 0) {
			this.yvel -= 1;
		}
	};
	
	//Creates a new Bullet instance, increments number of bullets fired.
	this.shoot = function() {
		timesShot++;
		shot[timesShot] = new Bullet();
	};
	
	this.draw = function() {
		context.beginPath();
		context.rect(this.x - 5, this.y, 10, 15);
		context.arc(this.x, this.y, 5, 0, 2 * Math.PI);
		context.closePath();
		context.fillStyle = BLACK;
		context.fill();
	};

}

/*
	bullet struct
*/
function Bullet() {
	/*Maths for bullet, trig based
	 * Sets a vector for the bullet to travel
	 * on based on where the mouse is relative
	 * to the player.
	*/
	this.adj = mousePos.x - player.x;
	this.opp = mousePos.y - player.y;
	this.hyp = Math.sqrt(this.adj * this.adj + this.opp * this.opp);
	//Bullet vector x (cos) component multiplied by bulletSpeed
	this.xvel = this.adj / this.hyp * bulletSpeed;
	//Bullet vector y (sin) component multiplied by bulletSpeed
	this.yvel = this.opp / this.hyp * bulletSpeed;
	//Sets starting coords to the player's coords
	this.x = player.x;
	this.y = player.y;
	this.isDestroyed = false;
	
	this.draw = function() {
		context.beginPath();
		context.arc(this.x, this.y, 3, 0, 2 * Math.PI);
		context.closePath();
		context.stroke();
	};

	this.move = function() {
		this.x += this.xvel;
 		this.y += this.yvel;
	};
	
		//checks for collisions
	this.hitTest = function() {
		this.hitTop		= this.y - 10;
		this.hitBot		= this.y + 20;
		this.hitLeft	= this.x - 15;
		this.hitRight	= this.x + 15;
		
		for (var i = 1; i < numEnemies; i++) {
			if (
				enemy[i].x >= this.hitLeft
				&& enemy[i].x <= this.hitRight
				&& enemy[i].y >= this.hitTop
				&& enemy[i].y <= this.hitBot
				)
			{
				enemy[i].takeDamage();
				this.x = -10;
				this.xvel= 0;
				this.isDestroyed = true;
			}
		}
		if (
			this.x <= 0
			|| this.x >= map.w
			|| this.y <= 0
			|| this.y >= map.h
			)
		{
			this.x = -10;
			this.xvel= 0;
			this.isDestroyed = true;
		}
	};
}

function Map() {
	this.w = canvas.width;
	this.h = canvas.height;
	
	this.draw = function() {
		context.clearRect(0, 0, this.w, this.h);
		context.beginPath()
		context.linewidth = 3;
		context.moveTo(0,0);
		context.lineTo(this.w,0);
		context.lineTo(this.w,this.h);
		context.lineTo(0,this.h);
		context.lineTo(0,0);
		context.closePath();
		context.stroke();
	};

	this.drawHUD = function() {
		//Player's health
		context.font = "20px Georgia";
		context.fillStyle = BLACK;
		context.fillText("HP:", 10, 20);
		context.fillText(player.health, 50, 20);
	};
}

function endGame() {
	context.font = "50px Georgia";
	context.fillStyle = RED;
	context.fillText("You survived", 300, 200);
	context.fillText(Math.round(tickCount / 60), 325, 250);
	context.font = "30px Georgia";
	context.fillText("Seconds", 450, 250);
}

//Gets the mouse's position
//Borrowed from Dave/Sushil's tic-tac-toe code
function getMousePos (canvas, evt) {
	var rect = canvas.getBoundingClientRect();
		return {
			x: evt.clientX - rect.left,
			y: evt.clientY - rect.top
		};
}

//Input event listeners.
window.addEventListener ('keydown', function(evt) {
	keyPressed[evt.keyCode] = true;
}, false);
window.addEventListener ('keyup', function(evt) {
	keyPressed[evt.keyCode] = false;
}, false);
window.addEventListener ('mousemove', function(evt) {
	mousePos = getMousePos(canvas, evt);
}, false);
window.addEventListener ('mousedown', function(evt) {
	mouseDown = true;
	mouseTick = 0;
}, false);
window.addEventListener ('mouseup', function(evt) {
	mouseDown = false;
}, false);
