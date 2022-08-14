"use strict";

const TARGET_FPS = 30;
const GAME_VERSION = "v0.1.1 (pzpl.ovh)";
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");
const wireframe = false;
const noDamage = false;
const collisionHitbox = false;

function intersects(x1, y1, w1, h1, x2, y2, w2, h2) {
	if (w2 !== Infinity && w1 !== Infinity) {
		w2 += x2;
		w1 += x1;
		if (isNaN(w1) || isNaN(w2) || x2 > w1 || x1 > w2) return false;
	}
	if (y2 !== Infinity && h1 !== Infinity) {
		h2 += y2;
		h1 += y1;
		if (isNaN(h1) || isNaN(y2) || y2 > h1 || y1 > h2) return false;
	}
	return true;
}

let drawOutline = () => {
	const A = [];
	const B = [];
	let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
	let a = [];
	for (let i = 0; i < canvas.width; i++) a.push(0);
	for (let i = 0; i < canvas.height; i++) {
		A.push(a.slice());
		B.push(a.slice());
	}

	/* Save image data to 2D array A */
	let xi = 0;
	let yi = 0;
	for (let i = 3; i < imgData.length; i += 4) {
		xi++;
		if (xi % canvas.width === 0) {
			xi = 0;
			yi++;
		}
		if (xi < canvas.width && yi < canvas.height) {
			A[xi][yi] = imgData[i] > 0 ? 1 : 0;
		}
	}

	/* Save the outline to 2D array B */
	for (let i = 0; i < A.length; i++) {
		for (let j = 0; j < A[i].length; j++) {
			if (A[i][j] === 1) {
				try {
					/* Edge Detector Filter - Diagonal included */
					let vx = [-1, 0, 1, 1, 1, 0, -1, -1];
					let vy = [1, 1, 1, 0, -1, -1, -1, 0];
					/* Edge Detector Filter - Diagonal excluded */
					//let vx = [ 0, 1, 0, -1];
					//let vy = [1, 0, -1, 0];
					for (let k = 0; k < vx.length; k++) {
						if (i + vx[k] >= 0 && i + vx[k] <= canvas.width && j + vy[k] >= 0 && j + vy[k] <= canvas.height) {
							if (A[i + vx[k]][j + vy[k]] === 0) {
								/* Put 1 for all outer pixels */
								for (let k = 0; k < vx.length; k++) {
									if (A[i + vx[k]][j + vy[k]] === 0)
										B[i + vx[k]][j + vy[k]] = 1;
								}
								B[i][j] = 1;
							}
						}
					}

				} catch (e) {

				}
			}
		}
	}

	for (let i = 0; i < B.length; i++) {
		for (let j = 0; j < B[i].length; j++) {
			if (B[i][j] === 1) {
				ctx.beginPath();
				ctx.fillStyle = "#000";
				ctx.fillRect(i - 1, j, 2, 2);
			}
		}
	}
}

let leiJun = new Image();
let evoxJoey = {
	image: new Image(),
	alive: true,
	active: false,
	X: -180,
	change: 1,
	health: 120,
	shooting: false
};
let bullet = new Image();
let sg = new Image();
let playerBullet = new Image();
let evoxBullet = new Image();

document.querySelector("#tps").innerText = TARGET_FPS;
document.querySelector("#gameVersion").textContent = GAME_VERSION;

function load() {
	ctx.font = "40px sans-serif";
	ctx.fillText("Loading...", 10, 50);
	let loaded = 0;

	function markAsLoaded() {
		loaded++;
	}

	leiJun.onload = markAsLoaded;
	bullet.onload = markAsLoaded;
	sg.onload = markAsLoaded;
	playerBullet.onload = markAsLoaded;
	evoxJoey.image.onload = markAsLoaded;
	evoxBullet.onload = markAsLoaded;
	leiJun.src = "./assets/leijun.png";
	evoxJoey.image.src = "./assets/joeyhuab.png";
	bullet.src = "./assets/weapons/memeui.png";
	sg.src = "./assets/sg.png";
	playerBullet.src = "./assets/weapons/PE.png";
	evoxBullet.src = "./assets/weapons/EvoBanner.webp";
	let waitForLoaded = setInterval(function () {
		if (loaded === 6) {
			clearInterval(waitForLoaded);
			start();
		}
	}, 100);
}

function start() {
	function gameOver(tick, regenTick) {
		clearInterval(tick);
		clearInterval(regenTick);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		let gameOver = new Image();
		gameOver.onload = function () {
			ctx.drawImage(gameOver, 0, 0, canvas.width, canvas.height);
		}
		gameOver.src = "./assets/destroyed.webp";
		document.querySelector("button").style.display = "block";
	}

	let leiHealth = 100;
	let sgX = 0;
	let sgHealth = 50;

	function renderHealth() {
		ctx.fillStyle = "grey";
		ctx.fillRect(leiX + 70, leiJun.height + 20, 100, 5);
		ctx.fillStyle = "red";
		ctx.fillRect(leiX + 70, leiJun.height + 20, leiHealth, 5);

		ctx.fillStyle = "grey";
		ctx.fillRect(sgX + 35, 130, 50, 5);
		ctx.fillStyle = "red";
		ctx.fillRect(sgX + 35, 130, Math.floor(sgHealth), 5);

		ctx.fillStyle = "grey";
		ctx.fillRect(evoxJoey.X + 20, 420, 120, 5);
		ctx.fillStyle = "red";
		ctx.fillRect(evoxJoey.X + 20, 420, Math.floor(evoxJoey.health), 5);
	}

	document.querySelector("button").style.display = "none";

	// Reset Joey Huab
	evoxJoey.alive = true;
	evoxJoey.active = false;
	evoxJoey.X = -180;
	evoxJoey.change = 1;
	evoxJoey.health = 120;
	evoxJoey.shooting = false;

	onkeydown = function (e) {
		if (e.key === "ArrowRight") {
			sgX += 10;
		}
		if (e.key === "ArrowLeft") {
			sgX -= 10;
		}
	}

	let leiX = 100;
	let leiChange = 2;
	let miuiBullets = 0;
	let playerCanShoot = true;

	let bulletRenderQueue = [];

	evoxJoey.interval = setInterval(function () {
		evoxJoey.active = true;
	}, 10000);

	let regenerationTick = setInterval(function () {
		if (leiHealth < 100) {
			leiHealth++;
		}
		if (sgHealth < 100) {
			sgHealth++;
		}
	}, 1000);

	let gameTick = setInterval(function () {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		ctx.font = "11px sans-serif";
		ctx.fillStyle = "black";
		ctx.fillText(`Escape from MIUI ${GAME_VERSION}`, 10, 580);

		ctx.drawImage(leiJun, leiX, 600 - leiJun.height);
		ctx.drawImage(sg, sgX, 0, 128, 128);

		if (evoxJoey.active && evoxJoey.alive) {
			ctx.drawImage(evoxJoey.image, evoxJoey.X, 420, 180, 180);
			evoxJoey.X += evoxJoey.change;

			if (!evoxJoey.shooting && evoxJoey.X > 10 && Math.random() > .95) {
				evoxJoey.shooting = true;
				bulletRenderQueue.push({
					X: evoxJoey.X,
					Y: 420,
					bullet: evoxBullet,
					width: evoxBullet.width,
					height: evoxBullet.height,
					bulletID: 2,
					baseHealthDamage: 15
				});
			}
		}

		leiX += leiChange;
		if (leiX > (canvas.width - leiJun.width) || leiX < 0) {
			leiChange *= -1;
		}

		if (evoxJoey.X > canvas.width) {
			evoxJoey.X = -180;
			evoxJoey.active = false;
		}

		renderHealth();

		if (miuiBullets < 4 && Math.random() > .95) {
			miuiBullets++;
			bulletRenderQueue.push({
				X: leiX + Math.floor(Math.random() * (leiJun.width + 50)),
				Y: 400,
				bullet: bullet,
				width: 20,
				height: 80,
				bulletID: 1,
				baseHealthDamage: 5
			});
		}

		onkeyup = function (e) {
			if (playerCanShoot && e.key === " ") {
				bulletRenderQueue.push({
					X: sgX,
					Y: sg.y,
					bullet: playerBullet,
					width: playerBullet.width,
					height: playerBullet.height,
					bulletID: 0,
					baseHealthDamage: 5
				});
				playerCanShoot = false;
				setTimeout(() => {
					playerCanShoot = true
				}, 600);
			}
		}

		bulletRenderQueue.forEach((bullet) => {
			if ((bullet.bulletID === 1 || bullet.bulletID === 2) && !noDamage && intersects(bullet.X, bullet.Y, bullet.width, bullet.height, sgX, 0, 128, 128)) {
				sgHealth -= bullet.baseHealthDamage + Math.floor(Math.random() * 10);
				bulletRenderQueue = bulletRenderQueue.filter(item => item !== bullet);
				if (bullet.bulletID === 1) {
					miuiBullets--;
				}
				if (sgHealth < 1) {
					gameOver(gameTick, regenerationTick);
				}
			}

			if (bullet.bulletID === 0 && !noDamage && intersects(bullet.X, bullet.Y, bullet.width, bullet.height, evoxJoey.X,  420, 180, 180)) {
				console.log("SRAM!");
				evoxJoey.health -= bullet.baseHealthDamage + Math.floor(Math.random() * 16);
				if (evoxJoey.health < 1) {
					evoxJoey.alive = false;
				}
				bulletRenderQueue = bulletRenderQueue.filter(item => item !== bullet);
			}

			if (bullet.bulletID === 0 && !noDamage && intersects(bullet.X, bullet.Y, bullet.width, bullet.height, leiX, 600 - leiJun.height, leiJun.width, leiJun.height)) {
				leiHealth -= bullet.baseHealthDamage + Math.floor(Math.random() * 10);
				if (leiHealth < 1) {
					clearInterval(gameTick);
					clearInterval(regenerationTick);
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					ctx.font = "40px sans-serif";
					ctx.fillText("You won.", 10, 50);
					document.querySelector("button").style.display = "block";
				}
				console.log(leiHealth)
				bulletRenderQueue = bulletRenderQueue.filter(item => item !== bullet);
				if (collisionHitbox) {
					clearInterval(gameTick);
					clearInterval(regenerationTick);
					ctx.fillRect(bullet.X, bullet.Y, playerBullet.width, playerBullet.height);
					ctx.fillRect(leiX, 600 - leiJun.height, leiJun.width, leiJun.height);
				}
			}

			if (bullet.bulletID === 1 || bullet.bulletID === 2) {
				bullet.Y -= 7;
			} else {
				bullet.Y += 7;
			}
			ctx.drawImage(bullet.bullet, bullet.X, bullet.Y, bullet.width, bullet.height);

			if (bullet.bulletID === 1 && bullet.Y < -10) {
				bulletRenderQueue = bulletRenderQueue.filter(item => item !== bullet);
				miuiBullets--;
			}

			if (bullet.bulletID === 0 && bullet.Y > 600) {
				bulletRenderQueue = bulletRenderQueue.filter(item => item !== playerBullet);
			}
		});
	}, 1000 / TARGET_FPS);
	console.log("started gameTick");

	if (wireframe) {
		setInterval(drawOutline, 1000 / TARGET_FPS);
	}
}