/**
 * Created by white on 2017/9/18.
 */

(function (window) {
    window.initScene3d = function (model) {
        var scene, camera, fieldOfView, aspectRatio, nearPlane, farPlane;
        var HEIGHT, WIDTH, renderer, container,controls;
        var hemisphereLight, shadowLight;
        var Colors = {
            red : 0xf25346,
            white: 0xd8d0d1,
            brown: 0x59332e,
            pink: 0xF5986E,
            brownDark: 0x23190f,
            blue: 0x68c3c0
        }

        function init(){
            createScene();
            createLights();
            createModel(model);
            initControls();
            animate();
        }

        function createScene() {
            HEIGHT = window.innerHeight;
            WIDTH = window.innerWidth;
            scene = new THREE.Scene();
            scene.fog = new THREE.Fog(0x000, 100, 950);

            aspectRatio = WIDTH / HEIGHT;
            fieldOfView = 60;
            nearPlane = 1;
            farPlane = 1000;
            camera = new THREE.PerspectiveCamera(fieldOfView, aspectRatio, nearPlane, farPlane);
            camera.position.set(0, 100, 100);
            // camera.lookAt(new THREE.Vector3(0,30,0));

            renderer = new THREE.WebGLRenderer({antialias: true});
            renderer.setClearColor(0xffffff);
            renderer.setSize(WIDTH, HEIGHT);
            renderer.shadowMap.enabled = true;

            container = document.getElementById('three');
            container.appendChild(renderer.domElement);

            window.addEventListener('resize', handleWindowResize, false);
        }

        function createLights() {
            hemisphereLight = new THREE.HemisphereLight(0xaaaaaa,0x000000,.9);
            shadowLight = new THREE.DirectionalLight(0xffffff,.9);
            shadowLight.position.set(150,350,350);
            shadowLight.castShadow = true;
            shadowLight.shadow.camera.left = -400;
            shadowLight.shadow.camera.right = 400;
            shadowLight.shadow.camera.top = 400;
            shadowLight.shadow.camera.bottom = -400;
            shadowLight.shadow.camera.near = 1;
            shadowLight.shadow.camera.far = 1000;

            shadowLight.shadow.mapSize.width = 2048;
            shadowLight.shadow.mapSize.height = 2048;

            scene.add(hemisphereLight);
            scene.add(shadowLight);
        }

        function createBox() {
            var geo = new THREE.BoxGeometry(20,20,20);
            var mat = new THREE.MeshPhongMaterial({
                color:Colors.white
            })
        }

        function createModel(obj) {
            var modelCont = obj;
            modelCont.position.set(0, -20, 0);
            modelCont.scale.set(25,25,25);
            modelCont.updateMatrixWorld();
            modelCont.traverse(function (child) {
                console.log(child);
                if (child instanceof THREE.Mesh) {
                    // addModelMat(child);
                }
            });
            scene.add(modelCont);
        }

        function initControls() {
            controls = new THREE.OrbitControls(camera,renderer.domElement);
        }

        function handleWindowResize() {
            HEIGHT = window.innerHeight;
            WIDTH = window.innerWidth;
            renderer.setSize(WIDTH, HEIGHT);
            camera.aspect = WIDTH / HEIGHT;
            camera.updateProjectionMatrix();
        }

        function animate() {
            controls.update();
            renderer.render(scene,camera);
            requestAnimationFrame(animate);
        }

        init();
    }
})(window);