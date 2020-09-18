"use strict";

let cubeRotation = 0.0;

function main() {
    /** @type {HTMLCanvasElement} */
    const canvas = document.getElementById("canvas");
    /** @type {WebGL2RenderingContext} */
    const gl = canvas.getContext("webgl");

    if (!gl) {
        alert("Please use a modern web browser, as your current one does not support WebGL.");
    }
    
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const vertexShaderSource = `
        attribute vec4 aVertexPosition;
        attribute vec3 aVertexNormal;
        attribute vec2 aTextureCoord;

        uniform mat4 uNormalMatrix;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        varying highp vec2 vTextureCoord;
        varying highp vec3 vLighting;

        void main(void) {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
            vTextureCoord = aTextureCoord;

            // Apply lighting
            highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
            highp vec3 directionalLightColor = vec3(1, 1, 1);
            highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

            highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

            highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
            vLighting = ambientLight + (directionalLightColor * directional);
        }
    `;

    const fragmentShaderSource = `
        varying highp vec2 vTextureCoord;
        varying highp vec3 vLighting;

        uniform sampler2D uSampler;
        
        void main(void) {
            highp vec4 texelColor = texture2D(uSampler, vTextureCoord);

            gl_FragColor = vec4(texelColor.rgb * vLighting, texelColor.a);
        }
    `;

    // Initialize shader program
    const shaderProgram = initShaderProgram(gl, vertexShaderSource, fragmentShaderSource);

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
            vertexNormal: gl.getAttribLocation(shaderProgram, "aVertexNormal"),
            textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),
        },
        uniformLocations: {
            modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
            projectionMatrix: gl.getUniformLocation(shaderProgram, "uProjectionMatrix"),
            normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix"),
            uSampler: gl.getUniformLocation(shaderProgram, "uSampler"),
        }
    };

    const buffers = initBuffers(gl);
    const texture = loadTexture(gl, "./assets/wood-texture.jpg");

    let then = 0;

    // Draw the scene repeatedly to the gl canvas
    function render(now) {
        now *= 0.001; // convert to seconds
        const deltaTime = now - then;
        then = now;

        drawScene(gl, programInfo, buffers, texture, deltaTime);
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

function initBuffers(/** @type {WebGL2RenderingContext} */gl) {
    // Create a buffer for the square's positions.
    const positionBuffer = gl.createBuffer();

    // Select the positionBuffer as the one to apply buffer operations to from here on.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Now, create an array of positions for the square.
    const positions = [
        // Front face
        -1.0, -1.0,  1.0,
         1.0, -1.0,  1.0,
         1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0, -1.0, -1.0,

        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
         1.0,  1.0,  1.0,
         1.0,  1.0, -1.0,
  
        // Bottom face
        -1.0, -1.0, -1.0,
         1.0, -1.0, -1.0,
         1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,
        
        // Right face
         1.0, -1.0, -1.0,
         1.0,  1.0, -1.0,
         1.0,  1.0,  1.0,
         1.0, -1.0,  1.0,
        
        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
    ];

    /*
    Now, pass the list of positions into WebGL to build
    the shape. We do this by creating a Float32Array from the
    JS array, then use it to fill the current buffer.
    */

    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW
    );

    // Set up the normals for the vertices, so that we can compute lighting.
    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

    const vertexNormals = [
        // Front
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,

        // Back
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,
        0.0,  0.0, -1.0,

        // Top
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,

        // Bottom
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,
        0.0, -1.0,  0.0,

        // Right
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,
        1.0,  0.0,  0.0,

        // Left
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0,
        -1.0,  0.0,  0.0
    ];

    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(vertexNormals),
        gl.STATIC_DRAW
    );

    // Set up the texture coordinates for the faces.
    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

    const textureCoordinates = [
        // Front
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Back
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Top
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Bottom
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Right
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
        // Left
        0.0,  0.0,
        1.0,  0.0,
        1.0,  1.0,
        0.0,  1.0,
    ];

    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(textureCoordinates),
        gl.STATIC_DRAW
    );

    const faceColors = [
        [1.0, 1.0, 1.0, 1.0], // Front face: white
        [1.0, 0.0, 0.0, 1.0], // Back face: red
        [0.0, 1.0, 0.0, 1.0], // Top face: green
        [0.0, 0.0, 1.0, 1.0], // Bottom face: blue
        [1.0, 1.0, 0.0, 1.0], // Right face: yellow
        [1.0, 0.0, 1.0, 1.0]  // Left face: purple
    ];

    // Convert the arr of colors into a table for all the vertices.
    let colors = [];

    for (let i = 0; i < faceColors.length; i++) {
        const color = faceColors[i];

        colors = colors.concat(color, color, color, color);
    }

    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    // Build the element array buffer (this specifies the indices)
    // into the vertex arrays for each face's vertices.
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // This array defines each face as two triangles, using
    // the indices into the vertex array to specify each
    // triangle's position.
    const indices = [
        0,  1,  2,    0,  2,  3,  // front
        4,  5,  6,    4,  6,  7,  // back
        8,  9,  10,   8,  10, 11, // top
        12, 13, 14,   12, 14, 15, // bottom
        16, 17, 18,   16, 18, 19, // right
        20, 21, 22,   20, 22, 23  // left
    ];

    // Now, send the element array to GL
    gl.bufferData(
        gl.ELEMENT_ARRAY_BUFFER,
        new Uint16Array(indices), gl.STATIC_DRAW
    );

    return {
        position: positionBuffer,
        normal: normalBuffer,
        textureCoord: textureCoordBuffer,
        indices: indexBuffer
    };
}

// Init a texture and load an image.
// When the image is done loading, copy it into the texture.
function loadTexture(/** @type {WebGL2RenderingContext} */gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Because images have to be download over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue

    gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        width,
        height,
        border,
        srcFormat,
        srcType,
        pixel
    );

    const image = new Image();
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            level,
            internalFormat,
            srcFormat,
            srcType,
            image
        );

        // WebGL1 has different requirements for power of 2 images
        // vs non power of 2 images so check if the image is a
        // power of 2 in both dimensions.

        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn off mips and set
            // wrapping to clamp to edge.

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    };

    image.src = url;

    return texture;
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}


function drawScene(/** @type {WebGL2RenderingContext} */gl, programInfo, buffers, texture, deltaTime) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0); // pure black
    gl.clearDepth(1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Create a perspective matrix, a special matrix that is
    // used to simulate the distortion of perspective in a camera.
    // Our field of view is 45 degrees, with a width/height
    // ratio that matches the display size of the canvas
    // and we only want to see objects between 0.1 units
    // and 100 units away from the camera.

    const fov = 45 * Math.PI / 180; // radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    mat4.perspective(projectionMatrix, fov, aspect, zNear, zFar);

    // Set drawing position to the identity point
    const modelViewMatrix = mat4.create();

    // Move the drawing position to where the square should be drawn
    mat4.translate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to translate
        [-0.0, 0.0, -6.0] // amount to translate
    );
    mat4.rotate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to rotate
        cubeRotation,    // amount to rotate in radians
        [0, 0, 1]        // axis to rotate around (Z)
    );
    mat4.rotate(
        modelViewMatrix, // destination matrix
        modelViewMatrix, // matrix to rotate
        cubeRotation * 0.7,    // amount to rotate in radians
        [0, 1, 0]        // axis to rotate around (X)
    );

    const normalMatrix = mat4.create();

    mat4.invert(normalMatrix, modelViewMatrix);
    mat4.transpose(normalMatrix, normalMatrix);

    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute
    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexPosition,
            numComponents,
            type,
            normalize,
            stride,
            offset);
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexPosition);
    }

    // Tell WebGL how to pull out the normals from the normal
    // buffer into the vertexNormal attribute.
    {
        const numComponents = 3;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
        gl.vertexAttribPointer(
            programInfo.attribLocations.vertexNormal,
            numComponents,
            type,
            normalize,
            stride,
            offset
        );
        gl.enableVertexAttribArray(
            programInfo.attribLocations.vertexNormal
        );
    }

    // Tell WebGL how to pull out the texture coordinates from 
    // the texture coordinate buffer and into the textureCoord attribute.
    {
        const num = 2;
        const type = gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;

        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
        gl.vertexAttribPointer(
            programInfo.attribLocations.textureCoord,
            num,
            type,
            normalize,
            stride,
            offset
        );
        gl.enableVertexAttribArray(programInfo.attribLocations.textureCoord);
    }

    // Tell WebGL which indices to use to index the vertices.
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    // Tell WebGL to use the program when drawing
    gl.useProgram(programInfo.program);

    // Set the shader uniforms
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix
    );
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.modelViewMatrix,
        false,
        modelViewMatrix
    );
    gl.uniformMatrix4fv(
        programInfo.uniformLocations.normalMatrix,
        false,
        normalMatrix
    );

    // Specify the texture to map onto the faces.
    // Tell WebGL we want to affect texture unit 0.
    gl.activeTexture(gl.TEXTURE0);
    // Bind the texture to texture unit 0.
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Tell the shader we bound the texture to texture unit 0.
    gl.uniform1i(programInfo.uniformLocations.uSampler, 0);

    {
        const vertexCount = 36;
        const type = gl.UNSIGNED_SHORT;
        const offset = 0;
        
        gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }

    // Update the rotation for the next draw
    cubeRotation += deltaTime;
}

function initShaderProgram(/** @type {WebGL2RenderingContext} */gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // Create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program fails, alert error
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert(`Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram)}`);
    }

    return shaderProgram;
}

// Creates a shader of the given type, uploads the source, then compiles it.
function loadShader(/** @type {WebGL2RenderingContext} */gl, type, source) {
    const shader = gl.createShader(type);

    // Send the source to the shader object.
    gl.shaderSource(shader, source);

    // Compile shader program.
    gl.compileShader(shader);

    // Did it work?
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
    }

    return shader;
}

main();