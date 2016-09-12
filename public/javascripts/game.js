var game = new Phaser.Game(1280, 736, Phaser.CANVAS, '', {
    preload: preload,
    create: create,
    update: update,
    render: render
});

var map,
    layer = [],
    socket,
    player,
    gui = {},
    tools = [],
    style = {
        font: "12px Arial",
        fill: "#ffffff",
        align: "center"
    };

function preload() { //function preload () {

    game.load.tilemap('map', '../images/tiles.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image('tiles', '../images/tiles.png');
    game.load.image('crack', '../images/crack.png');
    game.load.image('pickAxe', '../images/pickAxe.png');
    game.load.image('selector', '../images/quickBarSelector.png');
    game.load.spritesheet('player', '../images/player.png', 36, 56);
    game.load.spritesheet('tilesSprite', '../images/tiles.png', 32, 32);
    game.load.json('tools', '../json/tools.json');

}

function create() { //function create () {

    game.physics.startSystem(Phaser.Physics.ARCADE);

    tools = game.cache.getJSON('tools');

    createMap();
    createPlayer();
    createTileMarker();
    createMenuGroup();
    createInputEvents();

}

function update() { //function update () {

    game.physics.arcade.collide(player, layer[1]);

    updatePlayerMovements();

}

function render() { //function render () {
    game.debug.body(player);
}

function createMap() { //function createMap() {

    map = game.add.tilemap('map');
    map.addTilesetImage('tiles', 'tiles');
    map.addTilesetImage('crack', 'crack');

    layer[0] = map.createLayer('Tile Layer 1');
    layer[0].scrollFactorX = 0.33;
    layer[0].scrollFactorY = 0.33;

    layer[1] = map.createLayer('Tile Layer 2');
    map.setCollisionBetween(1, 10000, true, layer[1]);

    layer[2] = map.createLayer('Tile Layer 3');

    layer[0].resizeWorld();

}

function createPlayer() { //function createPlayer() {

    player = game.add.sprite(50, 50, 'player');
    game.physics.arcade.enable(player);
    player.body.bounce.y = 0.2;
    player.body.collideWorldBounds = true;
    player.body.setSize(18, 46, 7, 5);
    player.anchor.setTo(0.5, 0.5);
    player.body.gravity.y = 550;
    player.body.gravity.x = 20;
    player.body.velocity.x = 100;
    player.useQuickBarItem = null;
    player.toolSprite = game.make.sprite(0,10,null);
    player.toolSprite.anchor.setTo(0, 1);
    game.physics.arcade.enable(player.toolSprite);
    player.addChild(player.toolSprite);
    player.equipment = {
        head:{},
        body:{},
        foot:{},
        acc1:{},
        acc2:{},
        tool:{
            NAME:null,
            DMG:null,
            SPD:null,
            STR:null,
            RNG:null,
            sprite:null
        }
    };
    player.inventory = [];
    for (var i = 0; i < 40; i++) {
        player.inventory[i] = {
            tileIndex: -1,
            tileQuantity: 0,
            tileProperties: {}
        }
    }
    player.facing = 'left';
    player.marker = game.add.graphics();

    player.animations.add('left', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 20, true);
    player.animations.add('turn', [14], 20, true);
    player.animations.play(player.facing);

    game.camera.follow(player);

}

function createTileMarker() { //function createTileMarker() {

    player.marker.lineStyle(2, 0x000000, 1);
    player.marker.drawRect(0, 0, 32, 32);

}

function updateMarker() { //function updateMarker() {

    player.marker.x = layer[1].getTileX(game.input.activePointer.worldX) * 32;
    player.marker.y = layer[1].getTileY(game.input.activePointer.worldY) * 32;

}

function createMenuGroup() { //function createInventoryMenuGroup() {

    gui.inventory = game.add.group();

    var inventoryBackground = game.make.graphics();
    inventoryBackground.beginFill(0x000000, 0.6);
    inventoryBackground.drawRoundedRect(16, 72, 444, 180, 10);
    inventoryBackground.endFill();

    gui.inventory.add(inventoryBackground);

    gui.inventory.socket = [];

    var i;
    var x = 20;
    var y = 76;

    for (i = 0; i < 40; i++) {
        gui.inventory.socket[i] = {
            itemSprite: game.make.sprite(x+4,y+4,null)
        };
        gui.inventory.add(gui.inventory.socket[i].itemSprite);
        x += 44;
        if (x > 444) {
            x = 20;
            y += 44;
        }
    }

    gui.inventory.fixedToCamera = true;
    gui.inventory.alpha = 0;

    gui.quickBar = game.add.group();

    var quickBarBackground = game.make.graphics();
    quickBarBackground.beginFill(0x000000, 0.6);
    quickBarBackground.drawRoundedRect(16, 16, 444, 48, 10);
    quickBarBackground.endFill();

    gui.quickBar.add(quickBarBackground);

    gui.quickBar.socket = [];

    x = 20;
    y = 20;

    for (i = 0; i < 10; i++) {
        gui.quickBar.socket[i] = {
            item: null,
            selectedMarker: game.make.sprite(x,y,null),
            background: game.make.graphics(),
            itemSprite: game.make.sprite(x+4,y+4,null)
        };
        gui.quickBar.socket[i].background.beginFill(0x666666, 0.7);
        gui.quickBar.socket[i].background.drawRoundedRect(x, y, 40, 40, 5);
        gui.quickBar.socket[i].background.endFill();
        gui.quickBar.add(gui.quickBar.socket[i].background);
        gui.quickBar.add(gui.quickBar.socket[i].selectedMarker);
        gui.quickBar.add(gui.quickBar.socket[i].itemSprite);
        x += 44;
    }

    gui.quickBar.fixedToCamera = true;
    gui.quickBar.alpha = 1;

    gui.quickBar.socket[0].item = tools[0];
    gui.quickBar.socket[0].itemSprite.loadTexture(gui.quickBar.socket[0].item.sprite);
}

function createInputEvents() { //function createInputEvents() {

    game.input.addMoveCallback(updateMarker, this);

    game.input.mouse.mouseWheelCallback = mouseWheel;
    game.input.keyboard.addKey(Phaser.Keyboard.I).onDown.add(showInventoryMenu, this);

}

function showInventoryMenu() { //function showInventoryMenu() {

    gui.inventory.alpha = !gui.inventory.alpha;
    buildInventoryMenu();

}

function buildInventoryMenu() { //function buildInventoryMenu() {

    for (var i = 0; i < 40; i++) {
        if (player.inventory[i].tileIndex != -1) {
            if (gui.inventory.socket[i].itemSprite.textSprite != null) gui.inventory.socket[i].itemSprite.textSprite.destroy();
            var text = '';
            text += player.inventory[i].tileQuantity;
            if (player.inventory[i].tileQuantity < 10) {
                gui.inventory.socket[i].itemSprite.textSprite = game.add.text(22, 16, text, style);
            } else {
                gui.inventory.socket[i].itemSprite.textSprite = game.add.text(15, 16, text, style);
            }
            gui.inventory.socket[i].itemSprite.loadTexture('tilesSprite', player.inventory[i].tileIndex - 1);
            gui.inventory.socket[i].itemSprite.addChild(gui.inventory.socket[i].itemSprite.textSprite);
            gui.inventory.socket[i].itemSprite.inputEnabled = true;
            gui.inventory.socket[i].itemSprite.input.enableDrag(true);
        }
    }

}

function updatePlayerMovements() { //function updatePlayerMovements() {

    player.body.velocity.x = 0;

    if (game.input.keyboard.addKey(Phaser.Keyboard.A).isDown) {
        player.scale.x = -1;
        player.body.velocity.x = -150;
        if (player.facing != 'left') {
            player.animations.play('left');
            player.facing = 'left';
        }
    } else if (game.input.keyboard.addKey(Phaser.Keyboard.D).isDown) {
        player.scale.x = 1;
        player.body.velocity.x = 150;
        if (player.facing != 'right') {
            player.animations.play('left');
            player.facing = 'right';
        }
    } else {
        if (player.facing != 'idle') {
            player.animations.stop();
            if (player.facing == 'left') {
                player.scale.x = -1;
            } else {
                player.scale.x = 1;
            }
            player.frame = 14;
            player.facing = 'idle';
        }
    }

    if (game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).isDown && player.body.blocked.down) {
        player.body.velocity.y = -350;
    }

    for (var i = 48; i < 58; i++) {
        var num = i - 49;
        if (num == -1) num = 9;
        if (game.input.keyboard.addKey(i).isDown) useItemNumber(num);
    }
    
    if (player.toolSprite != null) {
        if (game.input.mousePointer.leftButton.isDown) {
            player.toolSprite.body.angularVelocity = player.equipment.tool.SPD;
            hitTile(map.layers[1].data[player.marker.y / 32][player.marker.x / 32]);
            updateMarker();
        } else {
            if (player.toolSprite.body.angularVelocity != 0) player.toolSprite.body.angularVelocity = 0;
            if (player.toolSprite.angle != -20) player.toolSprite.angle = -20;
        }
    }

}

function mouseWheel() { //function mouseWheel() {

    var i = player.useQuickBarItem + game.input.mouse.wheelDelta;
    if (i < 0) i = 9;
    else if (i > 9) i = 0;
    if (player.useQuickBarItem == null) i = 0;
    useItemNumber(i);

}

function useItemNumber(num) { //function useItemNumber(num) {

    if (player.useQuickBarItem != num) {
        if (player.useQuickBarItem != null) {
            var oldSelection = player.useQuickBarItem;
            gui.quickBar.socket[oldSelection].selectedMarker.loadTexture(null);
        }
        player.useQuickBarItem = num;
        gui.quickBar.socket[num].selectedMarker.loadTexture('selector');
        player.removeChild(player.toolSprite);
        player.toolSprite.loadTexture(null);
        player.equipment.tool = {};
        if (gui.quickBar.socket[num].item != null) {
            player.equipment.tool = gui.quickBar.socket[num].item;
            player.toolSprite.loadTexture(player.equipment.tool.sprite);
            game.physics.arcade.enable(player.toolSprite);
            player.addChild(player.toolSprite);
            player.toolSprite.angle = -20;
        }
    }

}

function hitTile(tile) { //function isTileDestroy(tile) {

    var distance = Math.sqrt((Math.pow(player.position.x - tile.worldX,2)+Math.pow(player.position.y - tile.worldY,2)));

    if (player.toolSprite.angle >= 60) {
        player.toolSprite.angle = -20;
        if (tile.index != -1 && distance < player.equipment.tool.RNG && tile.properties.minForce <= player.equipment.tool.STR) {
            updateMarker();
            tile.properties.currentHp -= player.equipment.tool.DMG;
            if (tile.properties.currentHp <= 0) {
                sendToInventory(tile);
                map.putTile(-1, layer[1].getTileX(player.marker.x), layer[1].getTileY(player.marker.y), layer[1]);
                map.putTile(-1, layer[2].getTileX(player.marker.x), layer[2].getTileY(player.marker.y), layer[2]);
            } else {
                var crackLength = tile.properties.currentHp / tile.properties.maxHp;
                var crackTile = 153;
                for (var a = 0; a < 5; a++) {
                    if (crackLength > 0) crackTile--;
                    crackLength -= 0.2;
                }
                map.putTile(crackTile, layer[2].getTileX(player.marker.x), layer[2].getTileY(player.marker.y), layer[2]);
            }
        }
    }

}

function sendToInventory(tile) { //function sendToInventory(tile) {

    var tileFound = false;
    var emptySlotId = -1;

    for (var i = 0; i < 40; i++) {
        if (player.inventory[i].tileIndex == tile.index) {
            player.inventory[i].tileQuantity++;
            tileFound = true;
            break;
        } else if (player.inventory[i].tileIndex == -1) {
            emptySlotId = i;
            break;
        }
    }

    if (!tileFound && emptySlotId != -1) {
        player.inventory[emptySlotId].tileIndex = tile.index;
        player.inventory[emptySlotId].tileQuantity = 1;
        player.inventory[emptySlotId].tileProperties = tile.properties;
    }

    buildInventoryMenu();

}