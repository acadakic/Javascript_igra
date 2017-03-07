var player;
var playerImg = new Image();
playerImg.src = 'player.png';
var enemyImg = new Image();
enemyImg.src = 'enemy.png';
var PLAYER_SPEED = 2;
var bullets = [];
var gameObjects = [];
var enemies = [];

function startGame() {
    scene.start();
    player = new drawPlayer();
	loadObjects();
	loadEnemies();
}

function loadObjects(){
	gameObjects = JSON.parse(objects);
}

function loadEnemies(){
	enemies = JSON.parse(enemyList);
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
	this.lives = 3;
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
			var go = gameObjects[i];
			if(go.y < this.y + this.height && go.y + go.height > this.y){
				if(go.x < this.x + this.width - 20 && this.direction == 0 && go.x + go.width > this.x + this.width - 20){
					noObsticle = false;
					break;
				}else if(go.x + go.width > this.x && go.x < this.x && this.direction == 1){
					noObsticle = false;
					break;
				}
			}
		}
		
		if(noObsticle && limit){
			scrollScene();
		}
		if(noObsticle && (limit || allowMove)){
			this.traveledDistance += this.speedX;
		}
		if(allowMove && !limit && noObsticle){
			this.x += this.speedX;
		}
		var colision = false;
		for(var i = 0 ; i < gameObjects.length; i++) {
			var go = gameObjects[i];
			if(go.x < this.x + this.width - 30 && go.x + go.width > this.x + 20 && go.y < this.y + this.height && go.y + go.height > this.y){
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
					var go = gameObjects[i];
					if(go.x < this.x + this.width - 30 && go.x + go.width > this.x && go.y < this.y + this.height && go.y + go.height > this.y + this.height){
						this.y = go.y - this.height;
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
				var go = gameObjects[i];
				if(go.x < this.x + this.width - 30 && go.x + go.width > this.x && go.y <= this.y + this.height && go.y + go.height > this.y){
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
	drawEnemies();
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
		var bulletDirection = player.direction == 0 ? 1 : -1;
		bullets.push(new createBullet(bulletDirection, player.x + (bulletDirection == 1 ? 60 : 0), player.y + 40, 10));
		//createBullet();
		//player.lastShot = 0;
		//scene.keys[65] = false;
	}
    player.newPos();    
    player.update();
	
	moveBullets();
	drawUI();
}

function moveBullets(){
	for(var i = bullets.length - 1; i >= 0; i--) {
		var bullet = bullets[i];
        bullet.x += bullet.speed * bullet.direction;
        bullet.update();
		if(bullet.x < 0 || bullet.x > scene.canvas.width){
			bullets.splice(i,1);
		}
		else {
			for(var j = 0 ; j < gameObjects.length; j++) {
				var go = gameObjects[j];
				if(go.y < bullet.y + bullet.width && go.y + go.height > bullet.y){
					if(go.x < bullet.x + bullet.width && bullet.direction == 1 && go.x + go.width > bullet.x + bullet.width){
						bullets.splice(i,1);
						break;
					}else if(go.x + go.width > bullet.x && go.x < bullet.x && bullet.direction == -1){
						bullets.splice(i,1);
						break;
					}
				}
			}
			for(var j = 0 ; j < enemies.length; j++) {
				var currentEnemy = enemies[j];
				var enemyRightX = currentEnemy.currentX + currentEnemy.imageWidth;
				var enemyLeftX = enemyRightX - currentEnemy.width;
				if(currentEnemy.y + currentEnemy.imageHeight - currentEnemy.height < bullet.y + bullet.width && currentEnemy.y + currentEnemy.imageHeight > bullet.y){
					if(enemyLeftX < bullet.x + bullet.width && bullet.direction == 1 && enemyRightX > bullet.x + bullet.width){
						bullets.splice(i,1);
						break;
					}else if(enemyRightX > bullet.x && enemyLeftX <bullet.x && bullet.direction == -1){
						bullets.splice(i,1);
						break;
					}
				}
			}
			var playerRightX = player.x + player.width - 25;
			var playerLeftX = player.x + 20;
			if(player.y + 10 < bullet.y + bullet.width && player.y + player.height > bullet.y){
				if(playerLeftX < bullet.x + bullet.width && bullet.direction == 1 && playerRightX > bullet.x + bullet.width){
					player.lives--;
					bullets.splice(i,1);
					break;
				}else if(playerRightX > bullet.x && playerLeftX < bullet.x && bullet.direction == -1){
					player.lives--;
					bullets.splice(i,1);
					break;
				}
			}
		}
    }
}

function scrollScene(){
	for(var i = 0 ; i < gameObjects.length; i++) {
		gameObjects[i].x -= player.speedX;
	}
	for(var i = 0 ; i < enemies.length; i++) {
		if(enemies[i].startTime <= player.traveledDistance){
			enemies[i].currentX -= player.speedX;
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

function drawEnemies(){
	for(var i = 0 ; i < enemies.length; i++) {
		var enemy = enemies[i];
		if(enemy.startTime <= player.traveledDistance || enemy.startX != enemy.currentX){
			ctx = scene.context;
			
			var sourceX = Math.round(enemy.timeShooting / 5) * 60;
			var sourceY = 0;
			if(enemy.timeShooting > 40){
				sourceX = 0;
			}
			
			ctx.drawImage(enemyImg, sourceX, sourceY, enemy.imageWidth / 2, enemy.imageHeight / 2 - 1, enemy.currentX, enemy.y, enemy.imageWidth, enemy.imageHeight);
			if(enemy.timeShooting == 25){
				bullets.push(new createBullet(enemy.direction, enemy.currentX + 50, enemy.y + 40, 3));
			}
			else if(enemy.timeShooting > 80){
				enemy.timeShooting = 0;
			}	
			
			if(enemy.direction == -1 && enemy.currentX > enemy.finalX){
				enemy.currentX -= enemy.speed;
			}
			if(enemy.currentX <= enemy.finalX){
				enemy.timeShooting++;
			}
		}
    }
}

function jump(){
	player.jumpPosition = player.jumpSpeed;
	player.y -= player.jumpSpeed;
}

function createBullet(direction, x, y, speed){
	this.direction = direction;
	this.x = x;
	this.y = y;
	this.width = 5;
	this.speed = speed;
	
	this.update = function() {
        ctx = scene.context;
		ctx.fillStyle = "red";
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.width, 0, 2 * Math.PI);
		ctx.fill();
    }
}

function drawUI(){
	ctx = scene.context;
	ctx.fillStyle = "red";
	ctx.font = "30px Arial";
	ctx.fillStyle = "blue";
	ctx.fillText("Lives: " + player.lives, 0, 30);
}