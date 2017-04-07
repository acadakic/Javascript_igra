var player;
var playerImg = new Image();
playerImg.src = 'player.png';
var enemyImg = new Image();
enemyImg.src = 'enemy.png';

var PLAYER_SPEED = 2;
var GRAVITY = 0.18;
var START_JUMP_SPEED = 6;
var JUMP_HEIGHT = 101;

var bullets = [];
var gameObjects = [];
var enemies = [];
var gameOver = false;

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
		this.canvas.style="background-color:gray;";
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
	this.lives = 30;
    this.width = 74;
    this.height = 82;
    this.speedX = 0;
    this.x = 100;
	this.allowShot = true;
	this.crouch = false;
	this.crouchTime = 0;
    this.y = scene.canvas.height - 100 - this.height;    
	this.direction = 0;
	this.timeMoving = 0;
	this.jumpPosition = 0;
	this.jumpDirection = 1;
	this.jumpSpeed = START_JUMP_SPEED;
	this.allowJump = true;
	this.traveledDistance = 0;
	this.laser = false;
	
    this.update = function() {
        ctx = scene.context;
		if(this.timeMoving > 45){
			this.timeMoving = 5;
		}
		var sourceX;
		var sourceY = this.direction * (this.height / 2);
		
		if(this.crouch){
			sourceY += this.height;
			sourceX = this.crouchTime < 3 ? 0 : this.width / 2;
		}
		else {
			sourceX = Math.round(this.timeMoving / 5) * (this.width / 2);
		}
		ctx.drawImage(playerImg, sourceX, sourceY, this.width / 2 - 1, this.height / 2, this.x, this.y, this.width, this.height);
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
			if(go.visible && go.y < this.y + this.height && go.y + go.height > this.y){
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
			if(go.visible && go.x < this.x + this.width - 30 && go.x + go.width > this.x + 20 && go.y < this.y + this.height && go.y + go.height > this.y){
				colision = true;
				break;
			}
		}
			
		if(this.jumpPosition >= JUMP_HEIGHT || colision){
			this.jumpDirection = -1;
		}
		else if(this.jumpPosition == 0){
			this.jumpDirection = 1;
			this.allowJump = true;
			this.jumpSpeed = START_JUMP_SPEED;
		}
		if(this.jumpDirection == 1 && this.jumpPosition > 0 && this.jumpPosition < JUMP_HEIGHT){
			if(this.jumpSpeed > 2){
				this.jumpSpeed -= GRAVITY;
			}
			this.y -= this.jumpSpeed;
			this.jumpPosition += this.jumpSpeed;
		}
		else if(this.jumpDirection == -1 && this.jumpPosition > 0){
			if(this.jumpPosition < this.jumpSpeed && this.y + this.height + this.jumpSpeed > scene.canvas.height - 100){
				this.y = scene.canvas.height - 100 - this.height;
				this.jumpPosition = 0;
			}
			else{
				if(this.jumpSpeed < START_JUMP_SPEED){
					this.jumpSpeed += GRAVITY;
				}
				this.y += this.jumpSpeed;
				this.jumpPosition -= this.jumpSpeed;
				
				for(var i = 0 ; i < gameObjects.length; i++) {
					var go = gameObjects[i];
					if(go.visible && go.x < this.x + this.width - 30 && go.x + go.width > this.x + 10 && go.y < this.y + this.height && go.y + go.height > this.y + this.height){
						this.y = go.y - this.height;
						this.jumpPosition = 0;
						this.jumpDirection = 1;
						this.allowJump = true;
						this.jumpSpeed = START_JUMP_SPEED;
						break;
					}
				}
			}			
		}
		
		if(this.y < scene.canvas.height - 100 - this.height && this.jumpPosition <= 0){
			var fall = true;
			for(var i = 0 ; i < gameObjects.length; i++) {
				var go = gameObjects[i];
				if(go.visible && go.x < this.x + this.width - 30 && go.x + go.width > this.x + 10 && go.y <= this.y + this.height && go.y + go.height > this.y){
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
	if(gameOver){
		gameOverText();
		return;
	}
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
		player.crouch = true;
		if(player.crouchTime  < 3){
			player.crouchTime++;
		}
	}
	else {
			player.crouch = false;
			player.crouchTime = 0;
	}
	if (scene.keys && scene.keys[83] && player.allowJump == true) {
		player.allowJump = false;
		jump();
	}
	if(scene.keys && scene.keys[65] == true && player.allowShot == true){
		if(player.laser){
			drawLaser();
		}
		else{
			player.allowShot = false;
			var bulletDirection = player.direction == 0 ? 1 : -1;
			var bulletHeight = player.y + 40;
			if(player.crouch){
				bulletHeight += 20;
			}
			bullets.push(new createBullet(bulletDirection, player.x + (bulletDirection == 1 ? 60 : 0), bulletHeight, 10, -1, -1, true));
		}		
	}
    player.newPos();    
    player.update();
	
	moveBullets();
	drawUI();
}

function drawLaser(){
	ctx = scene.context;
	var laserHeight = player.y + 40;
	if(player.crouch){
		laserHeight += 20;
	}
	var colors = shuffleColors();
	
	var startX = player.x + (player.direction == 0 ? 60 : 0);
	var endX = player.direction == 0 ? scene.canvas.width : 0;
	ctx.beginPath();
	ctx.moveTo(startX, laserHeight);
	ctx.lineTo(endX, laserHeight);
	ctx.strokeStyle = colors[0];
	ctx.stroke();
	
	laserHeight += 1;
	ctx.beginPath();
	ctx.moveTo(startX, laserHeight);
	ctx.lineTo(endX, laserHeight);
	ctx.strokeStyle = colors[1];
	ctx.stroke();
	
	laserHeight += 1;
	ctx.beginPath();
	ctx.moveTo(startX, laserHeight);
	ctx.lineTo(endX, laserHeight);
	ctx.strokeStyle = colors[2];
	ctx.stroke();
}

function shuffleColors() {
	var array = ["red", "blue", "yellow"];	
	var currentIndex = 3, temporaryValue, randomIndex;
	while (0 !== currentIndex) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex -= 1;
		temporaryValue = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temporaryValue;
	}
	return array;
}

function moveBullets(){
	for(var i = bullets.length - 1; i >= 0; i--) {
		var bullet = bullets[i];
        if(bullet.framesToChangeY > 0){
			bullet.framesLeftToChangeY--;
			if(bullet.framesLeftToChangeY <= 0){
				bullet.y += bullet.speed * bullet.verticalDirection;
				bullet.framesLeftToChangeY += bullet.framesToChangeY;
			}
			bullet.x += bullet.direction * bullet.speed;
		}
		else if(bullet.framesToChangeX > 0){
			bullet.framesLeftToChangeX--;
			if(bullet.framesLeftToChangeX <= 0){
				bullet.x += bullet.speed * bullet.direction;
				bullet.framesLeftToChangeX += bullet.framesToChangeX;
			}
			bullet.y += bullet.verticalDirection * bullet.speed;
		}
		else{
			bullet.x += bullet.direction * bullet.speed;
		}
		
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
			if(bullet.player){
				for(var j = enemies.length - 1; j >= 0; j--) {
					var currentEnemy = enemies[j];
					var enemyRightX = currentEnemy.currentX + currentEnemy.imageWidth;
					var enemyLeftX = enemyRightX - currentEnemy.width;
					if(currentEnemy.y + currentEnemy.imageHeight - currentEnemy.height < bullet.y + bullet.width && currentEnemy.y + currentEnemy.imageHeight > bullet.y){
						if(enemyLeftX < bullet.x + bullet.width && bullet.direction == 1 && enemyRightX > bullet.x + bullet.width){
							bullets.splice(i,1);
							enemies.splice(j,1);
							break;
						}else if(enemyRightX > bullet.x && enemyLeftX <bullet.x && bullet.direction == -1){
							bullets.splice(i,1);
							enemies.splice(j,1);
							break;
						}
					}
				}
			}
			
			var playerRightX = player.x + player.width - 25;
			var playerLeftX = player.x + 20;
			var playerTopY = player.y + 10;
			if(player.crouch){
				playerTopY = player.y + player.height / 2;
			}
			if(playerTopY < bullet.y + bullet.width && player.y + player.height > bullet.y){
				if(playerLeftX < bullet.x + bullet.width && bullet.direction == 1 && playerRightX > bullet.x + bullet.width){
					playerHit(i);
					break;
				}else if(playerRightX > bullet.x && playerLeftX < bullet.x && bullet.direction == -1){
					playerHit(i);
					break;
				}
			}
		}
    }
}

function playerHit(i){
	player.lives--;
	bullets.splice(i,1);
	if(player.lives == 0){
		gameOver = true;
	}
}

function scrollScene(){
	for(var i = 0 ; i < gameObjects.length; i++) {
		gameObjects[i].x -= player.speedX;
	}
	for(var i = 0 ; i < bullets.length; i++) {
	var bullet = bullets[i];
		bullet.x -= player.speedX;
		bullet.destX -= player.speedX;
	}
	for(var i = 0 ; i < enemies.length; i++) {
		var enemy = enemies[i];
		if(enemy.startTime <= player.traveledDistance){
			enemy.currentX -= player.speedX;
			enemy.finalX -= player.speedX;
		}
	}
}

function drawGameObjects(){
	for(var i = 0 ; i < gameObjects.length; i++) {
		var go = gameObjects[i];
        ctx = scene.context;
		if(go.visible){
			ctx.fillStyle = "green";
		}
        else{
			ctx.fillStyle = "gray";
		}
        ctx.fillRect(go.x, go.y, go.width, go.height);
    }
}

function drawEnemies(){
	for(var i = 0 ; i < enemies.length; i++) {
		var enemy = enemies[i];
		if(enemy.direction == -1 && enemy.currentX < player.x){
			enemy.direction = 1;
		}
		else if(enemy.direction == 1 && enemy.currentX > player.x){
			enemy.direction = -1;
		}
		if(enemy.startTime <= player.traveledDistance || enemy.startX != enemy.currentX){
			ctx = scene.context;
			
			var sourceX = Math.round(enemy.timeShooting / 5) * 60;
			if(enemy.timeShooting > 40){
				sourceX = 0;
			}
			var sourceY = 0;
			var shift = 0;
			if(enemy.direction == 1){
				sourceY = enemy.imageHeight / 2;
				shift = enemy.imageWidth - enemy.width;
			}
			
			ctx.drawImage(enemyImg, sourceX, sourceY, enemy.imageWidth / 2, enemy.imageHeight / 2 - 1, enemy.currentX + shift, enemy.y, enemy.imageWidth, enemy.imageHeight);
			if(enemy.timeShooting == 25){
				var targetY = player.y + 22;
				if(player.crouch){
					targetY += 22;
				}
				if(enemy.direction == 1){
					shift += 30;
				}
				var targetX = player.x + 20;
				bullets.push(new createBullet(enemy.direction, enemy.currentX + 50 + shift, enemy.y + 40, 3, targetX, targetY, false));
			}
			else if(enemy.timeShooting > 80){
				enemy.timeShooting = 0;
			}
			
			var enemyRightX = enemy.currentX + enemy.imageWidth;
			var enemyLeftX = enemyRightX - enemy.width - 10;
			var noObsticle = true;
			for(var j = 0 ; j < gameObjects.length; j++) {
				var go = gameObjects[j];
				if(go.y < enemy.y + enemy.imageHeight && go.y + go.height > enemy.y){
					if(go.x < enemyRightX + 10 && enemy.direction == 1 && go.x + go.width > enemyRightX){
						noObsticle = false;
						break;
					}else if(go.x + go.width > enemyLeftX && go.x < enemyLeftX && enemy.direction == -1){
						noObsticle = false;
						break;
					}
				}
			}
			
			if(enemy.y < scene.canvas.height - 100 - enemy.imageHeight && enemy.jumpPosition <= 0){
				var fall = true;
				for(var j = 0 ; j < gameObjects.length; j++) {
					var go = gameObjects[j];
					if(go.visible && go.x < enemyRightX && go.x + go.width > enemyLeftX + 15 && go.y <= enemy.y + enemy.imageHeight && go.y + go.height > enemy.y){
						fall = false;
						break;
					}
				}
				if(fall){
					enemy.jumpDirection = -1;
					enemy.jumpPosition = scene.canvas.height - 100 - enemy.y - enemy.imageHeight;
				}
			}
			
			if(enemy.jumpDirection == 1){
				if(enemy.jumpSpeed > 2){
					enemy.jumpSpeed -= GRAVITY;
				}
				enemy.y -= enemy.jumpSpeed;
				enemy.jumpPosition += enemy.jumpSpeed;
				if(enemy.jumpPosition >= JUMP_HEIGHT){
					enemy.jumpDirection = -1;
				}
			}
			else if(enemy.jumpDirection == -1){
				if(enemy.jumpSpeed < START_JUMP_SPEED){
					enemy.jumpSpeed += GRAVITY;
				}
				if(enemy.jumpPosition < enemy.jumpSpeed && enemy.y + enemy.imageHeight + enemy.jumpSpeed > scene.canvas.height - 100){
					enemy.y = scene.canvas.height - 100 - enemy.imageHeight;
					enemy.jumpPosition = 0;
					enemy.jumpDirection = 0;
				}
				else{
					if(enemy.jumpSpeed < START_JUMP_SPEED){
						enemy.jumpSpeed += GRAVITY;
					}
					enemy.y += enemy.jumpSpeed;
					enemy.jumpPosition -= enemy.jumpSpeed;
					
					for(var i = 0 ; i < gameObjects.length; i++) {
						var go = gameObjects[i];
						if(go.visible && go.x < enemyRightX + 10 && go.x + go.width > enemyRightX && go.y < enemy.y + enemy.imageHeight && go.y + go.height > enemy.y){
							enemy.y = go.y - enemy.imageHeight;
							enemy.jumpPosition = 0;
							enemy.jumpDirection = 0;
							break;
						}
					}
				}
			}
			
			if(enemy.direction == -1 && enemy.currentX > enemy.finalX && noObsticle){
				enemy.currentX -= enemy.speed;
			}
			else if(enemy.direction == 1 && enemy.currentX < enemy.finalX){
				enemy.currentX += enemy.speed;
			}
			if(enemy.currentX < 0 && noObsticle){
				enemy.currentX = 1;
			}
			if(!noObsticle){
				if(enemy.direction == -1){
					enemy.finalX = enemy.currentX;
				}
				else if (enemy.jumpDirection == 0 || enemy.jumpDirection == undefined){
					enemy.jumpDirection = 1;
					enemy.jumpPosition = 0;
					enemy.jumpSpeed = START_JUMP_SPEED;
				}
			}
			if((enemy.direction == -1 && enemy.currentX <= enemy.finalX) || (enemy.direction == 1 && enemy.currentX >= enemy.finalX)){
				enemy.timeShooting++;
			}
		}
    }
}

function jump(){
	player.jumpPosition = START_JUMP_SPEED;
	player.y -= START_JUMP_SPEED;
}

function createBullet(direction, x, y, speed, destX, destY, player){
	this.direction = direction;
	if(destY == -1 || y == destY){
		this.verticalDirection = 0;
	}
	else if(y > destY){
		this.verticalDirection = -1;
	}
	else if(y < destY){
		this.verticalDirection = 1;
	}
	this.x = x;
	this.y = y;
	this.width = 5;
	this.speed = speed;
	this.destX = destX;
	this.destY = destY;
	this.framesToChangeY = 0;
	this.framesLeftToChangeY = 0;
	this.framesToChangeX = 0;
	this.framesLeftToChangeX = 0;
	this.player = player;
	if(this.verticalDirection != 0){
		var h = 0;
		if(this.destY > this.y){
			h = this.destY - this.y;
		}
		else{
			h = this.y - this.destY;
		}
		var a = 0;
		if(this.x > this.destX){
			a = this.x - this.destX;
		}
		else{
			a = this.destX - this.x;
		}
		if(a > h){
			//if(bullet.destY != bullet.y && ((bullet.destX < bullet.x && bullet.direction == -1) || (bullet.x < bullet.destX && bullet.direction == 1))){
				//if(bullet.pixelsToChangeY <= 0){
					this.framesToChangeY =  a / h;
					framesLeftToChangeY = this.framesToChangeY;
				//}
			//}
		}
		else{
			//if(bullet.destX != bullet.x && ((bullet.destY < bullet.y && bullet.verticalDirection == -1) || (bullet.y < bullet.destY && bullet.verticalDirection == 1))){
				//if(bullet.pixelsToChangeX <= 0){
					this.framesToChangeX =  h / a;
					framesLeftToChangeX = this.framesToChangeX;
				//}
			//}
		}
	}
	
	this.update = function() {
        ctx = scene.context;
		ctx.fillStyle = "red";
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.width, 0, 2 * Math.PI);
		ctx.fill();
    }
}

function calculateBulletPath(bullet){
	if(bullet.verticalDirection != 0){
		var h = 0;
		if(bullet.destY > bullet.y){
			h = bullet.destY - bullet.y;
		}
		else{
			h = bullet.y - bullet.destY;
		}
		var a = 0;
		if(bullet.x > bullet.destX){
			a = bullet.x - bullet.destX;
		}
		else{
			a = bullet.destX - bullet.x;
		}
		if(a > h){
			//if(bullet.destY != bullet.y && ((bullet.destX < bullet.x && bullet.direction == -1) || (bullet.x < bullet.destX && bullet.direction == 1))){
				//if(bullet.pixelsToChangeY <= 0){
					bullet.pixelsToChangeY = Math.floor(a / h);
					framesLeftToChangeY = bullet.pixelsToChangeY;
				//}
			//}
		}
		else{
			//if(bullet.destX != bullet.x && ((bullet.destY < bullet.y && bullet.verticalDirection == -1) || (bullet.y < bullet.destY && bullet.verticalDirection == 1))){
				//if(bullet.pixelsToChangeX <= 0){
					bullet.pixelsToChangeX = Math.floor(h / a);
					framesLeftToChangeX = bullet.pixelsToChangeX;
				//}
			//}
		}
	}
}

function drawUI(){
	ctx = scene.context;
	ctx.font = "30px Arial";
	ctx.fillStyle = "blue";
	ctx.fillText("Lives: " + player.lives, 0, 30);
}

function gameOverText(){
	ctx = scene.context;
	ctx.fillStyle = "red";
	ctx.font = "40px Arial";
	ctx.textAlign = "center";
	ctx.fillText("GAME OVER :(", scene.canvas.width / 2, scene.canvas.height / 2); 
}