const COLORS = {
	Blue: 0x66b7ff,
	Ice: 0xadf6ff,
	LightBlue: 0xeaf2ff,
	Red: 0xff0000,
	White: 0xffffff,
	Gray: 0xe1e1e1,
	DarkBlue: 0x070a19
};

var HEIGHT = window.innerHeight;
var WIDTH = window.innerWidth;
const ORIGIN = new THREE.Vector3(0, 0, 0);

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

//auxillary functions
function loop(){
	World.update(); //update positions of all objects in scene
	World.collectTrash();
	// World.camera.position.z -= 1.5;
	World.renderer.render(World.scene, World.camera);
	window.requestAnimationFrame(loop);
}

function addWater(){
	var angle, posX, posY;
	angle = Math.random() *2*Math.PI;
	posX = Math.random()*birthRadius*Math.cos(angle);
	posY = Math.random()*birthRadius*Math.sin(angle);
	temp2 = new Water(1, angle, posX, posY, 1000);

	World.addMolecule(temp2);

	canPopulate = false;

	setTimeout(World.togglePopulate, 300); //cannot populate for another .3s
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
		var scene, camera, cubeCamera, waterCubeCamera, aspectRatio, near, far, fieldOfView, renderer; //cube camera isn't necessary, but use it to test 

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

		waterCubeCamera = new THREE.CubeCamera(near, far, 256);
		waterCubeCamera.renderTarget.minFilter = THREE.LinearMipMapLinearFilter;
		waterCubeCamera.position.set(0, 0, 980);

		scene.add(waterCubeCamera);

		renderer = new THREE.WebGLRenderer({alpha: true, antialias: true});
		renderer.setClearColor(COLORS.DarkBlue);
		renderer.setSize(WIDTH, HEIGHT);
		renderer.shadowMapEnabled = true;
		document.body.appendChild(renderer.domElement);
		this.objects = [];
		this.zPositions = [];
		this.lights = [];
		this.scene = scene;
		this.camera = camera;
		this.cubeCamera = cubeCamera;
		this.waterCubeCamera = waterCubeCamera;
		this.renderer = renderer;
		this.canPopulate = true;
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

	populate(){
		var loader;
		var _this = this;
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

		// for (var i=0; i<5; i++){
		// 	temp = new Water(Math.random()*5 + 1, Math.random()*2*Math.PI, -1, 0, 0, 1000);
		// 	this.scene.add(temp.mesh);
		// 	this.objects.push(temp);
		// }
		// for (var i=0; i<5; i++){
		// 	temp = new Water(.25, Math.PI, 0, -2 + Math.random()*4, -.75 + Math.random()*1.5, 993 + Math.random()*5);
		// 	this.scene.add(temp.mesh);
		// 	this.objects.push(temp);
		// }
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
		// console.log(this.canPopulate);
		// if (this.objects.length<15 && this.canPopulate){
		// 	var angle, posX, posY;
		// 	angle = Math.random() *2*Math.PI;
		// 	posX = Math.random()*birthRadius*Math.cos(angle);
		// 	posY = Math.random()*birthRadius*Math.sin(angle);
		// 	temp2 = new Water(1, angle, posX, posY, 1000);
		// 	this.objects.push(temp2);
		// 	this.scene.add(temp2.mesh);
		// 	this.canPopulate = false;
		// 	var _this = this;
		// 	setTimeout(function(){
		// 		_this.togglePopulate();
		// 	}, 900);
		// }

		// for (var i=0; i<this.objects.length; i++){
		// 	this.objects[i].update();
		// }
		// temp.mesh.rotation.y += .005;
		// // test.material.uniforms.time.value += .005;
		// // test.rotation.y += .003;
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

window.addEventListener('mousedown', addWater);

// window.addEventListener('mousemove', handleMouseMove);

//render

var World = new WORLD();

World.createLights();
World.populate();

loop();