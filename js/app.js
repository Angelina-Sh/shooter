const requestAnimFrame = (function() {
    return window.requestAnimationFrame,
           window.webkitRequestAnimationFrame,
           window.mozRequestAnimationFrame,
           window.oRequestAnimationFrame,
           window.msRequestAnimationFrame,
           function(callback) {
                window.setTimeout(callback, 1000/60)
           }

})()

let playerSpeed = 200
let bulletSpeed = 500
let enemySpeed = 100

const canvas = document.createElement('canvas')
const ctx = canvas.getContext('2d')
canvas.width = 512
canvas.height = 480
document.body.appendChild(canvas)

let lastTime 
const main = () => {
    const now = Date.now()
    const dt = (now - lastTime) / 1000.0

    update(dt)
    render()

    lastTime = now
    requestAnimFrame(main)
}

const init = () => {
    terrainPattern = ctx.createPattern(resources.get('img/terrain.png'), 'repeat')

    document.getElementById('play-again').addEventListener('click', () => reset())

    reset()
    lastTime = Date.now()
    main()
}

resources.load([
    'img/sprites.png',
    'img/terrain.png'
])
resources.onReady(init)

const player = {
    pos: [0, 0],
    sprite: new Sprite('img/sprites.png', [0, 0], [39, 39], 16, [0, 1])
}

let bullets = []
let enemies = []
let explosions = []

let lastFire = Date.now()
let gameTime = 0
let isGameOver
let terrainPattern

let score = 0
let scoreEl = document.getElementById('score')

const update = (dt) => {
    gameTime += dt

    handleInput(dt)
    updateEntities(dt)

    if (Math.random() < 1 - Math.pow(.993, gameTime)) {
        enemies.push({
            pos: [canvas.width, Math.random() * (canvas.height - 39)],
            sprite: new Sprite('img/sprites.png', [0, 78], [80, 39], 6, [0, 1, 2, 3, 2, 1])
        })
    }
    checkCollisions()

    scoreEl.innerHTML = score
}

const handleInput = (dt) => {
    if(input.isDown('DOWN') || input.isDown('s')) {
        player.pos[1] += playerSpeed * dt;
    }

    if(input.isDown('UP') || input.isDown('w')) {
        player.pos[1] -= playerSpeed * dt;
    }

    if(input.isDown('LEFT') || input.isDown('a')) {
        player.pos[0] -= playerSpeed * dt;
    }

    if(input.isDown('RIGHT') || input.isDown('d')) {
        player.pos[0] += playerSpeed * dt;
    }

    if(input.isDown('SPACE') &&
       !isGameOver &&
       Date.now() - lastFire > 100) {
        let x = player.pos[0] + player.sprite.size[0] / 2;
        let y = player.pos[1] + player.sprite.size[1] / 2;

        bullets.push({ pos: [x, y],
                       dir: 'forward',
                       sprite: new Sprite('img/sprites.png', [0, 39], [18, 8]) });
        bullets.push({ pos: [x, y],
                       dir: 'up',
                       sprite: new Sprite('img/sprites.png', [0, 50], [9, 5]) });
        bullets.push({ pos: [x, y],
                       dir: 'down',
                       sprite: new Sprite('img/sprites.png', [0, 60], [9, 5]) });


        lastFire = Date.now();
    }
}

const updateEntities = (dt) => {
    player.sprite.update(dt)

    for (let i = 0; i < bullets.length; i++) {
        let bullet = bullets[i]

        switch(bullet.dir) {
            case 'up': bullet.pos[1] -= bulletSpeed * dt
                       break
            case 'down': bullet.pos[1] += bulletSpeed * dt
                       break
            default:
                bullet.pos[0] += bulletSpeed * dt
        }

        if (bullet.pos[1] < 0 || bullet.pos[1] > canvas.height || bullet.pos[0] > canvas.width) {
            bullets.splice(i, 1)
            i--
        }
    }

    for (let i = 0; i < enemies.length; i++) {
        enemies[i].pos[0] -= enemySpeed * dt
        enemies[i].sprite.update(dt)
        if (enemies[i].pos[0] + enemies[i].sprite.size[0] < 0) {
                enemies.splice(i, 1)
                i--
        }
    }

    for (let i = 0; i < explosions.length; i++) {
        explosions[i].sprite.update(dt)
        if (explosions[i].sprite.done) {
                explosions.splice(i, 1)
                i--
        }
    }
}

const collides = (x, y, r, b, x2, y2, r2, b2) => {
    return !(r <= x2 || x > r2 || b <= y2 || y > b2)
}

const boxCollides = (pos, size, pos2, size2) => {
    return collides(pos[0], pos[1], pos[0] + size[0], pos[1] + size[1], pos2[0], pos2[1], pos2[0] + size2[0], pos2[1] + size2[1])
}

const checkCollisions = () => {
    checkPlayerBounds()

    for (let i = 0; i < enemies.length; i++) {
        let pos = enemies[i].pos
        let size = enemies[i].sprite.size

        for (let j = 0; j < bullets.length; j++) {
            let pos2 = bullets[j].pos
            let size2 = bullets[j].sprite.size

            if (boxCollides(pos, size, pos2, size2)) {
                enemies.splice(i, 1)
                i--
                score += 100
                explosions.push({
                    pos: pos,
                    sprite: new Sprite('img/sprites.png', [0, 117], [39, 39], 16, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], null, true)
                })
                bullets.splice(j, 1)
                break
            }
        }
        
        if (boxCollides(pos, size, player.pos, player.sprite.size)) {
            gameOver()
        }
    }
}

const checkPlayerBounds = () => {
    if (player.pos[0] < 0) {
        player.pos[0] = 0
    } else if (player.pos[0] > canvas.width - player.sprite.size[0]) {
        player.pos[0] = canvas.width - player.sprite.size[0]
    }

    if (player.pos[1] < 0) {
        player.pos[1] = 0
    } else if (player.pos[1] > canvas.height - player.sprite.size[1]) {
        player.pos[1] = canvas.height - player.sprite.size[1]
    }
}

const render = () => {
    ctx.fillStyle = terrainPattern
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    if (!isGameOver) {
        renderEntity(player)
    }

    renderEntities(bullets)
    renderEntities(enemies)
    renderEntities(explosions)
}

const renderEntities = (list) => {
    for (let i = 0; i < list.length; i++) {
        renderEntity(list[i])
    }
}

const renderEntity = (entity) => {
    ctx.save()
    ctx.translate(entity.pos[0], entity.pos[1])
    entity.sprite.render(ctx)
    ctx.restore()
}

const gameOver = () => {
    document.getElementById('game-over').style.display = 'block'
    document.getElementById('game-over-overlay').style.display = 'block'
    isGameOver = true
} 

const reset = () => {
    document.getElementById('game-over').style.display = 'none'
    document.getElementById('game-over-overlay').style.display = 'none'
    isGameOver = false
    gameTime = 0
    score = 0

    enemies = []
    bullets = []

    player.pos = [50, canvas.height / 2]
}