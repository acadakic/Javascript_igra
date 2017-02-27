var player;
var playerImg = new Image();   // Create new img element
playerImg.src = 'player.png';
var PLAYER_SPEED = 2;
var bullets = [];
var gameObjects = [];

function startGame() {
    scene.start();
    player = new drawPlayer();
	loadObjects();
}

function loadObjects(){
	gameObjects = JSON.parse(objects);
}

var scene = {
    canvas : document.createElement("canvas"),
    start : function() {
        this.canvas.width = 1060;
        this.canvas.height = 600;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.interval = setInterval(update, 20);
        window.addEventListener('keydown', function (e) {
            scene.keys = (scene.keys || []);
            scene.keys[e.keyCode] = (e.type == "keydown");
			//alert(e.keyCode);
        })
        window.addEventListener('keyup', function (e) {
			if(e.keyCode == 65){
				player.allowShot = true;
			}
            scene.keys[e.keyCode] = (e.type == "keydown");
        })
    }, 
    clear : function(){
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

function drawFloor(){
	ctx = scene.context;
	ctx.fillStyle = "orange";
	ctx.fillRect(0, scene.canvas.height - 100, scene.canvas.width, 100);
}

function drawPlayer() {
    this.gamearea = scene;
    this.width = 74;
    this.height = 82;
    this.speedX = 0;
    //this.speedY = 0;    
    this.x = 100;
	//this.fireRate = 30;
	this.allowShot = true;
    this.y = scene.canvas.height - 100 - this.height;    
	this.direction = 0;
	this.timeMoving = 0;
	this.jumpHeight = 99;
	this.jumpPosition = 0;
	this.jumpDirection = 1;
	this.jumpSpeed = 3;
	this.allowJump = true;
	this.traveledDistance = 0;
    this.update = function() {
        ctx = scene.context;
        //ctx.fillRect(this.x, this.y, this.width, this.height);
		if(this.timeMoving > 45){
			this.timeMoving = 5;
		}
		var sourceX = Math.round(this.timeMoving / 5) * (this.width / 2);
		var sourceY = this.direction * (this.height / 2);
		ctx.drawImage(playerImg, sourceX, sourceY, this.width / 2, this.height / 2, this.x, this.y, this.width, this.height);
		/*if(this.lastShot < this.fireRate){
			this.lastShot++;
		}*/
    }
    this.newPos = function() {
		var allowMove = true;
		var limit = false;
		var noObsticle = true;
		
		if(((this.traveledDistance < -100 || this.x < 0) && this.direction == 1) || (this.x > 500 && this.direction == 0))
		{
			allowMove = false;
			if(this.x > 500 && this.direction == 0){
				limit = true;
			}
		}
		for(var i = 0 ; i < gameObjects.length; i++) {
			if(gameObjects[i].y < this.y + this.height && gameObjects[i].y + gameObjects[i].height > this. y){
				if(gameObjects[i].x < this.x + this.width - 20 && this.direction == 0 && gameObjects[i].x + gameObjects[i].width > this.x + this.width - 20){
					noObsticle = false;
					break;
				}else if(gameObjects[i].x + gameObjects[i].width > this.x && gameObjects[i].x < this.x && this.direction == 1){
					noObsticle = false;
					break;
				}
			}
		}
		
		
		if(noObsticle && (limit || allowMove)){
			this.traveledDistance += this.speedX;
		}
		if(allowMove && !limit && noObsticle){
			this.x += this.speedX;
		}
		var colision = false;
		for(var i = 0 ; i < gameObjects.length; i++) {
			if(gameObjects[i].x < this.x + this.width - 30 && gameObjects[i].x + gameObjects[i].width > this.x + 20 && gameObjects[i].y < this.y + this.height && gameObjects[i].y + gameObjects[i].height > this.y){
				colision = true;
				break;
			}
		}
			
		if(this.jumpPosition == this.jumpHeight || colision){
			this.jumpDirection = -1;
		}
		else if(this.jumpPosition == 0){
			this.jumpDirection = 1;
			this.allowJump = true;
		}
		if(this.jumpDirection == 1 && this.jumpPosition > 0 && this.jumpPosition < this.jumpHeight){
			this.y -= this.jumpSpeed;
			this.jumpPosition += this.jumpSpeed;
		}
		else if(this.jumpDirection == -1 && this.jumpPosition > 0){
			if(this.jumpPosition < this.jumpSpeed){
				this.y = scene.canvas.height - 100 - this.height;
				this.jumpPosition = 0;
			}
			else{
				this.y += this.jumpSpeed;
				this.jumpPosition -= this.jumpSpeed;
				
				for(var i = 0 ; i < gameObjects.length; i++) {
					if(gameObjects[i].x < this.x + this.width - 30 && gameObjects[i].x + gameObjects[i].width > this.x && gameObjects[i].y < this.y + this.height && gameObjects[i].y + gameObjects[i].height > this.y + this.height){
						this.y = gameObjects[i].y - this.height;
						this.jumpPosition = 0;
						this.jumpDirection = 1;
						this.allowJump = true;
						break;
					}
				}
			}			
		}
		
		if(this.y < scene.canvas.height - 100 - this.height && this.jumpPosition == 0){
			var fall = true;
			for(var i = 0 ; i < gameObjects.length; i++) {
				if(gameObjects[i].x < this.x + this.width - 30 && gameObjects[i].x + gameObjects[i].width > this.x && gameObjects[i].y <= this.y + this.height && gameObjects[i].y + gameObjects[i].height > this.y){
					fall = false;
					break;
				}
			}
			if(fall){
				this.jumpDirection = -1;
				this.jumpPosition = scene.canvas.height - 100 - this.y - this.height;
			}
		}
    }    
}

function update() {
    scene.clear();
	drawFloor();
	drawGameObjects();
    player.speedX = 0;
    player.speedY = 0;    
    if (scene.keys && scene.keys[37]) {
		player.speedX = -PLAYER_SPEED; 
		player.timeMoving++;
		player.direction = 1;
	}
    else if (scene.keys && scene.keys[39]) {
		player.speedX = PLAYER_SPEED; 
		player.timeMoving++;
		player.direction = 0;
	}
	else{
		player.timeMoving = 0;
	}
    if (scene.keys && scene.keys[38]) {
		//player.speedY = -PLAYER_SPEED 
	}
    if (scene.keys && scene.keys[40]) {
		//cucanj
	}
	if (scene.keys && scene.keys[83] && player.allowJump == true) {
		player.allowJump = false;
		jump();
	}
	if(scene.keys && scene.keys[65] == true && player.allowShot == true){
		player.allowShot = false;
		bullets.push(new createBullet());
		//createBullet();
		//player.lastShot = 0;
		//scene.keys[65] = false;
	}
    player.newPos();    
    player.update();
	
	for(var i = bullets.length - 1; i >= 0; i--) {
        bullets[i].x += 10 * bullets[i].direction;
        bullets[i].update();
		if(bullets[i].x < 0 || bullets[i].x > scene.canvas.width){
			bullets.splice(i,1);
		}
    }
	
	scrollScene();
}

function scrollScene(){
	if(player.x >= 500){
		for(var i = 0 ; i < gameObjects.length; i++) {
			gameObjects[i].x = gameObjects[i].initX - player.traveledDistance + 400;
		}
	}
}

function drawGameObjects(){
	for(var i = 0 ; i < gameObjects.length; i++) {
        ctx = scene.context;
        ctx.fillStyle = "green";
        ctx.fillRect(gameObjects[i].x, gameObjects[i].y, gameObjects[i].width, gameObjects[i].height);
    }
}

function jump(){
	player.jumpPosition = player.jumpSpeed;
	player.y -= player.jumpSpeed;
}

function createBullet(){
	this.direction = player.direction == 0 ? 1 : -1;
	this.x = player.x + (this.direction == 1 ? 60 : 0);
	this.y = player.y + 40;
	
	this.update = function() {
        ctx = scene.context;
		ctx.fillStyle = "red";
		ctx.beginPath();
		ctx.arc(this.x, this.y, 5, 0, 2 * Math.PI);
		ctx.fill();
    }
	
}