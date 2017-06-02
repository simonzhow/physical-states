const COLORS = {
	Blue: 0x66b7ff,
	Ice: 0xadf6ff,
	LightBlue: 0xeaf2ff,
	Red: 0xff0000,
	White: 0xffffff,
	Gray: 0xe1e1e1,
	DarkBlue: 0x070a19,
	iron: 0x6b6e72,
	electron: 0xffffff
};

var HEIGHT = window.innerHeight;
var WIDTH = window.innerWidth;
const ORIGIN = new THREE.Vector3(0, 0, 0);
const SCENES = ['title', 'ice', 'metal', 'water', 'iron', 'mdma', 'salt'];

//global variables for testing
var test;
var customUniforms;
var iceTube;
var meth = []; var temp; var temp2; var temp3; var neg = -1; var fog; var gasherbrum; var torusRing; var metalNode; var metalLayer; var metalLayer2; var background;
var reflectiveMaterial;
var canPopulate = true; //use this to control intervals between adding molecules
var domeRadius = 50;
var birthRadius = domeRadius/10;
var TITLE;
var titleGlobe;
var globalWaterSphere;
var birthRadiusWater = 20;
var lattice;

//auxillary functions
var loop = function(){
	World.updateTitle(); //update positions of all objects in scene
	World.collectTrash();
	// World.camera.position.z -= 1.5;
	World.renderer.render(World.scene, World.camera);
	window.requestAnimationFrame(loop);
}

function addIce(){
	console.log('called');
	var angle, posX, posY;
	angle = Math.random() *2*Math.PI;
	posX = Math.random()*birthRadius*Math.cos(angle);
	posY = Math.random()*birthRadius*Math.sin(angle);
	temp2 = new Ice(1, angle, -1, posX, posY, 997);

	World.scene.add(temp2.mesh);
	World.objects.push(temp2);
}


var spawnWater = function(e){
	var x, y, z;
	z = 900;
	var vector = new THREE.Vector3();

	vector.set(
	    ( e.clientX / window.innerWidth ) * 2 - 1,
	    - ( e.clientY / window.innerHeight ) * 2 + 1,
	    0.5 );

	vector.unproject( World.camera );

	var dir = vector.sub( World.camera.position ).normalize();

	var distance = (z - World.camera.position.z) / dir.z;

	var pos = World.camera.position.clone().add( dir.multiplyScalar( distance ) );

	x = pos.x; y = pos.y;
	var size = 1 + Math.random()*5;

	temp = new Water(size, Math.random()*2*Math.PI, 1, x, y, z);
	World.scene.add(temp.mesh);
	World.objects.push(temp);
}

function distortWaterBackground(){
	globalWaterSphere.distort();
}

function distortTitleBackground(){
	titleGlobe.distort();
}

var requestId;
function collapseWorld(){
	if(World.collapse()){
		console.log("completed");
		window.cancelAnimationFrame(requestId);
		return;
	}
	requestId = window.requestAnimationFrame(collapseWorld);
}

var requestId2;
function float(){
	World.float(5, 2);
	requestId2 = window.requestAnimationFrame(float);
}

//WORLD CLASS.. will eventually control transitions/destruction of objects. find a way to customize populate function?

class WORLD{
	constructor(){ //initialize scene
		var scene, camera, cubeCamera, iceCubeCamera, aspectRatio, near, far, fieldOfView, renderer; //cube camera isn't necessary, but use it to test 

		scene = new THREE.Scene();
		scene.fog = new THREE.FogExp2( 0xcccccc, 0.002 );

		aspectRatio = WIDTH/HEIGHT;
		near = .1;
		far = 5000;

		camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, near, far);
		camera.position.set(0, 0, 1000);

		cubeCamera = new THREE.CubeCamera(near, far, 256); //by default, set cubeCamera in same position as regular camera w/ same near/far
		cubeCamera.renderTarget.minFilter = THREE.LinearMipMapLinearFilter;
		cubeCamera.position.set(0, 0, 1000);
		scene.add(cubeCamera);

		iceCubeCamera = new THREE.CubeCamera(near, far, 256);
		iceCubeCamera.renderTarget.minFilter = THREE.LinearMipMapLinearFilter;
		iceCubeCamera.position.set(0, 0, 980);

		scene.add(iceCubeCamera);

		renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
		renderer.setClearColor(COLORS.DarkBlue);
		renderer.setSize(WIDTH, HEIGHT);
		renderer.shadowMapEnabled = true;
		document.body.appendChild(renderer.domElement);
		this.objects = [];
		this.zPositions = [];
		this.lights = [];
		this.electrons = [];
		this.layers = [];
		this.titleIcons = [];
		this.scene = scene;
		this.camera = camera;
		this.cubeCamera = cubeCamera;
		this.iceCubeCamera = iceCubeCamera;
		this.renderer = renderer;
		this.canPopulate = true;
		this.curScene;
		return this;
	}

	createLights(){
		var directionalLight = new THREE.DirectionalLight(COLORS.White, .7);
		directionalLight.position.set(0, 0, 1).normalize();
		var ambientLight = new THREE.AmbientLight();
		ambientLight.position.set(0, 0, 950);
		var hemLight = new THREE.HemisphereLight(COLORS.Blue, COLORS.LightBlue);
		// scene.add(hemLight);
		this.scene.add(directionalLight);
		// this.scene.add(ambientLight);
		// this.lights.push(ambientLight);
		this.lights.push(directionalLight);
	}

	changeScene(scene){
		this.clearScene();
		if (scene == 'ice'){
			this.populateIce();
			loop = function(){
				World.updateIce();
				World.collectTrash();
				World.renderer.render(World.scene, World.camera);
				window.requestAnimationFrame(loop);
			}
		}
		else if (scene == 'water'){
			this.populateWater();
			loop = function(){
				World.updateWater();
				World.collectTrash();
				World.renderer.render(World.scene, World.camera);
				window.requestAnimationFrame(loop);
			}
		}
		else if (scene == 'iron'){
			this.populateIron();
			loop = function(){
				World.updateIron();
				World.collectTrash();
				World.renderer.render(World.scene, World.camera);
				window.requestAnimationFrame(loop);
			}
		}
		else if (scene == 'metal'){
			this.populateMetal();
			loop = function(){
				World.updateMetal();
				World.collectTrash();
				World.renderer.render(World.scene, World.camera);
				window.requestAnimationFrame(loop);
			}
		}
		else if (scene == 'title'){
			this.populateTitle();
			loop = function(){
				World.updateTitle();
				World.collectTrash();
				World.renderer.render(World.scene, World.camera);
				window.requestAnimationFrame(loop);
			}
		}
		else if (scene == 'mdma'){
			this.populateMDMA();
			loop = function(){
				World.updateMDMA();
				World.collectTrash();
				World.renderer.render(World.scene, World.camera);
				window.requestAnimationFrame(loop);
			}
		}
		else if (scene == 'salt'){
			this.populateSalt();
			loop = function(){
				World.updateSalt();
				World.collectTrash();
				World.renderer.render(World.scene, World.camera);
				window.requestAnimationFrame(loop);
			}
		}
	}

	populate(){
		return;
	}

	populateMetal(){
		var ionSize = 16;
	    var dis = 15*ionSize/1.3;
	    ionSize *= 1.5;

	    var i, j, k;
	    var x, y, z;
	    var m;
	    var n = 4;
	    var numKLayers = (n*2)-3;

	    var egeo = new THREE.SphereGeometry(ionSize/15, 10, 10);
	    var emat = new THREE.MeshPhongMaterial({
	      shininess: 25,
	      specular: 0xffffff,
	      emissive: COLORS.Ice,
	      color: COLORS.Blue
	    });

	    i=j=0;
	    for (var k=0; k<5; k++){
	      this.electrons[k] = new THREE.Group();
	      for(j=-5; j<5; j++){
	        for(i=-5; i<5; i++){
	            var electron = new THREE.Mesh(egeo, emat);
	            electron.position.x = i*dis + (Math.random()*dis);
	            electron.position.y = j*dis + (Math.random()*dis);
	            electron.position.z = 0;
	            this.electrons[k].add(electron);
	        }
	      }
	      this.electrons[k].position.z -= k*dis;
	      this.scene.add(this.electrons[k]);
	    }
	}
	
	populateIron(){
		var n = 4;
		lattice = new Lattice(n);
		lattice.mesh.position.set(-window.innerWidth/4, window.innerHeight/2, 950);
		this.scene.add(lattice.mesh);
		this.objects.push(lattice);
	}

	populateTitle(){
		var loader;
	    var _this = this;
	    var icons = [];
	    loader = new THREE.FontLoader();
	    loader.load('/assets/ultra.json', function(font){
	      var geometry, mat, mesh;
	      geometry = new THREE.TextGeometry('STATES', {
	        font: font,
	        size: 1,
	        height: .1,
	        curveSegments:12,
	        bevelThickness: 0,
	        bevelSize: .005,
	        bevelEnabled: false
	      });

	      THREE.GeometryUtils.center( geometry ).

	      mat = new THREE.MeshBasicMaterial({
	        color: 0xff0000
	      });

	      mesh = new THREE.Mesh(geometry, mat);
	      mesh.position.set(0, 0, 995);
	      TITLE = new Title(mesh, 0, 0, 995);
	      TITLE.mapToCube(_this.cubeCamera);
	      TITLE.mesh.material.color = new THREE.Color(COLORS.Ice);
	      _this.scene.add(mesh);
	      _this.objects.push(TITLE);
	    });

	    titleGlobe = new TitleGlobe(25, 0, 0, 980);
	    this.scene.add(titleGlobe.mesh);
	    this.objects.push(titleGlobe);

	    var iron = new Iron(.17, -2, -1.25, 995);
	    this.scene.add(iron.mesh);
	    this.objects.push(iron);
	    icons.push(iron.mesh);

	    var ice = new CubicIce(.25, Math.PI*2, -1, -1.25, 995);
	    ice.update = function(){
	    	this.mesh.rotation.z += this.speed*.05;
   			this.mesh.rotation.y += this.speed*.05;
	    }
	    this.scene.add(ice.mesh);
	    this.objects.push(ice);
	    icons.push(ice.mesh);

	    var metalNode = new TitleMetalNode(.17, 0, -1.25, 995);
	    this.scene.add(metalNode.mesh);
	    this.objects.push(metalNode);
	    metalNode.mapToCube(this.cubeCamera);
	    icons.push(metalNode.mesh);

	    var water = new Water(.3, Math.random()*2*Math.PI, 0, 1, -1.25, 995);
	    this.scene.add(water.mesh);
	    this.objects.push(water);	
	    icons.push(water.mesh);

	    this.titleIcons = icons;

	    window.addEventListener('mousedown', selectScene);
	}

	populateWater(){
		globalWaterSphere = new GlobalWaterSphere(50, 0, 0, 950);
	    globalWaterSphere.mapToCube(this.cubeCamera);
	    this.scene.add(globalWaterSphere.mesh);
	    this.objects.push(globalWaterSphere);
	    
	    var x, y, z;
	    x = Math.random()*WIDTH/2;
	    y = Math.random()*HEIGHT/2;
	    temp2 = new Water(5, Math.PI*2*Math.random(), 1, x, y, 980);
	    this.scene.add(temp2.mesh);
	    this.objects.push(temp2);
	    window.addEventListener('mousedown', distortWaterBackground);
	    window.addEventListener('mousedown', spawnWater);
	}

	populateIce(){
		temp = new IceDome(domeRadius, 500, 0, 0, 1000);
		temp.mapToCube(this.iceCubeCamera);
		this.objects.push(temp);
		this.scene.add(temp.mesh);
		window.addEventListener('mousedown', addIce);
	}

	togglePopulate(){
		console.log('tog');
		if (this.canPopulate)
			this.canPopulate = false;
		else
			this.canPopulate = true;
	}

	addMolecule(molecule){
		this.objects.push(molecule);
		this.scene.add(molecule.mesh);
	}

	update(){
		return;
	}

	updateMetal(){
		if(this.objects.length < 3) {
	      this.fillScene(new IceTube(0, 0, 0, 0, 1));
	    }

	    for (var i=0; i<this.objects.length; i++){
	      this.objects[i].update();
	    }

	    // core.material.uniforms.time.value += .005;
	    // core.rotation.y += .003;

	    var speed = 5;
	    for (var i = 0; i < this.electrons.length; i++) {
	      if (this.electrons[i].position.z >= 1000){
	        this.electrons[i].position.z = 0;
	      }
	      this.electrons[i].position.z += speed*5;
	    }
	  }

	fillScene(molecule){
	  this.scene.add(molecule.mesh);
	  this.objects.push(molecule);
	}

	updateIron(){
		for(var i=0; i<this.objects.length; i++){
	      this.objects[i].update();
	    }
	}

	updateTitle(){
		for(var i=0; i<this.objects.length; i++){
	      this.objects[i].update();
	    }
	}

	updateWater(){
		for(var i=0; i<this.objects.length; i++){
	      this.objects[i].update();
	    }
	    if (this.objects.length<25 && this.canPopulate){
	      var angle, posX, posY;
	      angle = Math.random() *2*Math.PI;
	      posX = Math.random()*birthRadiusWater*Math.cos(angle);
	      posY = Math.random()*birthRadiusWater*Math.sin(angle);
	      temp2 = new Water(1 + Math.random()*5, angle, 1, posX, posY, 900);
	      this.objects.push(temp2);
	      this.scene.add(temp2.mesh);
	      this.canPopulate = false;
	      var _this = this;
	      setTimeout(function(){
	        _this.togglePopulate();
	      }, 900);
	    }
	}

	updateIce(){
		if (this.objects.length<25 && this.canPopulate){
			var angle, posX, posY;
			angle = Math.random() *2*Math.PI;
			posX = Math.random()*birthRadius*Math.cos(angle);
			posY = Math.random()*birthRadius*Math.sin(angle);
			temp2 = new Ice(1, angle, posX, posY, 1000);
			this.objects.push(temp2);
			this.scene.add(temp2.mesh);
			this.canPopulate = false;
			var _this = this;
			setTimeout(function(){
				_this.togglePopulate();
			}, 900);
		}

		temp.mesh.rotation.y += .005;
		// test.material.uniforms.time.value += .005;
		// test.rotation.y += .003;
		for (var i=0; i<this.objects.length; i++){
			this.objects[i].update();
		}
	}

	collectTrash(){
		for (var i=0; i<this.objects.length; i++){ //if past camera, remove from scene and delete from array
			if (this.objects[i].pastCamera() || this.objects[i].outOfRange()){
				this.scene.remove(this.objects[i].mesh);
				this.objects.splice(i, 1);
			}
		} 
	}

	collapse(){ //returns complete if all objects have reached the origin
		var objectsAtOrigin = true;
		var objectAtOrigin = false;
		for (var i=0; i<this.objects.length; i++){
			objectAtOrigin = this.objects[i].moveToward(0, 0, 0, 10);
			if(!objectAtOrigin){
				objectsAtOrigin = false;
			}
		}
		return objectsAtOrigin;
	}

	saveObjectPositions(){
		for (var i=0; i<this.objects.length; i++){
			this.objectPositions.push(this.objects[i].mesh.position);
		}
	}

	float(magnitude, speed){
		var x, y, z; //get current positions
		for(var i=0; i<World.objects.length; i++){
			x = this.objects[i].mesh.position.x;
			y = this.objects[i].mesh.position.y;
			z = this.objects[i].mesh.position.z;
			this.objects[i].moveToward(x+magnitude, y+magnitude, z+magnitude, speed);
		}
	}

	clearScene(){ //remove all existing objects except for light/camera, etc.
		for (var i=0; i<this.objects.length; i++){
			this.scene.remove(this.objects[i].mesh); //remove the mesh
		}
		this.objects = []; //clear objects array
	}

	removeEventListeners(){
		window.removeEventListener('mousedown', addIce);
		window.removeEventListener('mousedown', spawnIce);
		window.removeEventListener('mousedown', distortWaterBackground);
		window.removeEventListener('mousedown', selectScene);
	}
}

//mouse events

var mouse = {x:0,y:0};
var cameraMoves = {x:0,y:0,z:-0.1,move:false,speed: 20};

function handleMouseMove(e){
	World.camera.position.x += Math.max(Math.min((e.clientX - mouse.x) * 1, cameraMoves.speed), -cameraMoves.speed);
	World.camera.position.y += Math.max(Math.min((mouse.y - e.clientY) * 1, cameraMoves.speed), -cameraMoves.speed);

    mouse.x = e.clientX;
    mouse.y = e.clientY;
}

function selectScene(e){ //select scene from title using raycasting
	var x, y;
	var raycaster = new THREE.Raycaster();
	var mouse = new THREE.Vector2();
	var iron = World.titleIcons[0];
	var ice = World.titleIcons[1];
	var metal = World.titleIcons[2];
	var water = World.titleIcons[3];

	mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;

	raycaster.setFromCamera(mouse, World.camera);
	var intersects = raycaster.intersectObjects(World.titleIcons, true);

	for (var i=0; i<intersects.length; i++){
		console.log(intersects[i].object.parent);
		for (var k=0; k<World.titleIcons.length; k++){
			if (intersects[i].object == World.titleIcons[k]){
				distortTitleBackground();
				if (intersects[i].object == iron){
					setTimeout(function(){
						World.changeScene('iron');
					}, 1000);
				} 
				else if (intersects[i].object == metal){
					setTimeout(function(){
						World.changeScene('metal');
					}, 1000);
				}
			}
			else if (intersects[i].object.parent.parent == World.titleIcons[k]){
				distortTitleBackground();
				if (intersects[i].object.parent.parent == water){
					setTimeout(function(){
						World.changeScene('water');
					}, 1000);
				} 
				else if (intersects[i].object.parent.parent == ice){
					setTimeout(function(){
						World.changeScene('ice');
					}, 1000);
				}
			}
		}
	}
}

// window.addEventListener('mousemove', handleMouseMove);

//render

var World = new WORLD();


//ICE

World.createLights();
World.populateTitle();

loop();