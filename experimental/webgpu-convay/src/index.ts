export {};

const canvas = document.querySelector('canvas')!;

if (!navigator.gpu)
	throw new Error('WebGPU not supported on this browser.');

const adapter = await navigator.gpu.requestAdapter();
if (!adapter)
	throw new Error('No appropriate GPUAdapter found.');

const WORKGROUP_SIZE = 8;
const GRID_SIZE = 32 * 2;
const device = await adapter.requestDevice();
const canvasFormat = navigator.gpu.getPreferredCanvasFormat();

const context = canvas.getContext('webgpu')!;
context.configure({
	device: device,
	format: canvasFormat,
});


const vertices = new Float32Array([
	// Triangle 1 (Blue)
	-0.8,
	-0.8,
	0.8,
	-0.8,
	0.8,
	0.8,

	// Triangle 2 (Red)
	-0.8,
	-0.8,
	0.8,
	0.8,
	-0.8,
	0.8,
]);

const vertexBuffer = device.createBuffer({
	label: 'Cell vertices',
	size:  vertices.byteLength,
	usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/0, vertices);


// Create a uniform buffer that describes the grid.
const uniformArray = new Float32Array([ GRID_SIZE, GRID_SIZE ]);
const uniformBuffer = device.createBuffer({
	label: 'Grid Uniforms',
	size:  uniformArray.byteLength,
	usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
});
device.queue.writeBuffer(uniformBuffer, 0, uniformArray);


// Create an array representing the active state of each cell.
const cellStateArray = new Uint32Array(GRID_SIZE * GRID_SIZE);


// Create a storage buffer to hold the cell state.
const cellStateStorage = [
	device.createBuffer({
		label: 'Cell State A',
		size:  cellStateArray.byteLength,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
	}),
	device.createBuffer({
		label: 'Cell State B',
		size:  cellStateArray.byteLength,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
	}),
];

// Set each cell to a random state, then copy the JavaScript array
// into the storage buffer.
for (let i = 0; i < cellStateArray.length; ++i)
	cellStateArray[i] = Math.random() > 0.6 ? 1 : 0;

device.queue.writeBuffer(cellStateStorage[0]!, 0, cellStateArray);


const vertexBufferLayout: GPUVertexBufferLayout = {
	arrayStride: 8,
	attributes:  [
		{
			format:         'float32x2',
			offset:         0,
			shaderLocation: 0, // Position, see vertex shader
		},
	],
};

const cellShaderModule = device.createShaderModule({
	label: 'Cell shader',
	code:  /* wgsl */`
	struct VertexInput {
		@location(0) pos: vec2f,
		@builtin(instance_index) instance: u32,
	};

	struct VertexOutput {
		@builtin(position) pos: vec4f,
		@location(0) cell: vec2f,
	};

	@group(0) @binding(0) var<uniform> grid: vec2f;
	@group(0) @binding(1) var<storage> cellState: array<u32>;

	@vertex
	fn vertexMain(input: VertexInput) -> VertexOutput {
		let i = f32(input.instance);
		let cell = vec2f(i % grid.x, floor(i / grid.x));
		let state = f32(cellState[input.instance]);

		let cellOffset = cell / grid * 2;

		let gridPos = (input.pos*state+1) / grid - 1 + cellOffset;

		var output: VertexOutput;
		output.pos = vec4f(gridPos, 0, 1);
		output.cell = cell;

		return output;
	}

	@fragment
	fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
		let c = input.cell / grid;

		return vec4f(0.7, 0.7, 0.7, 0.7);

		//return vec4f(c, 1 - c.x, 1);
	}
	`,
});

// Create the compute shader that will process the simulation.
const simulationShaderModule = device.createShaderModule({
	label: 'Game of Life simulation shader',
	code:  /* wgsl */`
	@group(0) @binding(0) var<uniform> grid: vec2f;
	@group(0) @binding(1) var<storage> cellStateIn: array<u32>;
	@group(0) @binding(2) var<storage, read_write> cellStateOut: array<u32>;

	fn cellIndex(cell: vec2u) -> u32 {
		return (cell.y % u32(grid.y)) * u32(grid.x) +
			(cell.x % u32(grid.x));
	}

	fn cellActive(x: u32, y: u32) -> u32 {
		return cellStateIn[cellIndex(vec2(x, y))];
	}

	@compute
	@workgroup_size(${ WORKGROUP_SIZE }, ${ WORKGROUP_SIZE })
	fn computeMain(@builtin(global_invocation_id) cell: vec3u) {
		// Determine how many active neighbors this cell has.
		let activeNeighbors = cellActive(cell.x+1, cell.y+1) +
			cellActive(cell.x+1, cell.y) +
			cellActive(cell.x+1, cell.y-1) +
			cellActive(cell.x, cell.y-1) +
			cellActive(cell.x-1, cell.y-1) +
			cellActive(cell.x-1, cell.y) +
			cellActive(cell.x-1, cell.y+1) +
			cellActive(cell.x, cell.y+1);

		let i = cellIndex(cell.xy);
		switch activeNeighbors {
			case 2: { // Active cells with 2 neighbors stay active.
				cellStateOut[i] = cellStateIn[i];
			}
			case 3: { // Cells with 3 neighbors become or stay active.
				cellStateOut[i] = 1;
			}
			default: { // Cells with < 2 or > 3 neightbors become inactive.
				cellStateOut[i] = 0;
			}
		}
	}`,
});


// Create the bind group layout and pipeline layout.
const bindGroupLayout = device.createBindGroupLayout({
	label:   'Cell Bind Group Layout',
	entries: [
		{
			binding:    0,
			// Add GPUShaderStage.FRAGMENT here if you are using the `grid` uniform in the fragment shader.
			visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
			buffer:     {}, // Grid uniform buffer
		}, {
			binding:    1,
			visibility: GPUShaderStage.VERTEX | GPUShaderStage.COMPUTE,
			buffer:     { type: 'read-only-storage' }, // Cell state input buffer
		}, {
			binding:    2,
			visibility: GPUShaderStage.COMPUTE,
			buffer:     { type: 'storage' }, // Cell state output buffer
		},
	],
});

const bindGroups = [
	device.createBindGroup({
		label:   'Cell renderer bind group A',
		layout:  bindGroupLayout,
		entries: [
			{
				binding:  0,
				resource: { buffer: uniformBuffer },
			},
			{
				binding:  1,
				resource: { buffer: cellStateStorage[0]! },
			},
			{
				binding:  2,
				resource: { buffer: cellStateStorage[1]! },
			},
		] satisfies GPUBindGroupEntry[],
	}),
	device.createBindGroup({
		label:   'Cell renderer bind group B',
		layout:  bindGroupLayout,
		entries: [
			{
				binding:  0,
				resource: { buffer: uniformBuffer },
			},
			{
				binding:  1,
				resource: { buffer: cellStateStorage[1]! },
			},
			{
				binding:  2,
				resource: { buffer: cellStateStorage[0]! },
			},
		] satisfies GPUBindGroupEntry[],
	}),
];


const pipelineLayout = device.createPipelineLayout({
	label:            'Cell Pipeline Layout',
	bindGroupLayouts: [ bindGroupLayout ],
});


const cellPipeline = device.createRenderPipeline({
	label:  'Cell pipeline',
	layout: pipelineLayout,
	vertex: {
		module:     cellShaderModule,
		entryPoint: 'vertexMain',
		buffers:    [ vertexBufferLayout ],
	},
	fragment: {
		module:     cellShaderModule,
		entryPoint: 'fragmentMain',
		targets:    [ { format: canvasFormat } ],
	},
});

// Create a compute pipeline that updates the game state.
const simulationPipeline = device.createComputePipeline({
	label:   'Simulation pipeline',
	layout:  pipelineLayout,
	compute: {
		module:     simulationShaderModule,
		entryPoint: 'computeMain',
	},
});


const UPDATE_INTERVAL = 100; // Update every 200ms (5 times/sec)
let step = 0; // Track how many simulation steps have been run

// Move all of our rendering code into a function
function updateGrid() {
	const encoder = device.createCommandEncoder();

	const computePass = encoder.beginComputePass();

	computePass.setPipeline(simulationPipeline);
	computePass.setBindGroup(0, bindGroups[step % 2]!);

	const workgroupCount = Math.ceil(GRID_SIZE / WORKGROUP_SIZE);
	computePass.dispatchWorkgroups(workgroupCount, workgroupCount);

	computePass.end();

	// Start a render pass
	step++; // Increment the step count

	const pass = encoder.beginRenderPass({
		colorAttachments: [
			{
				view:       context.getCurrentTexture().createView(),
				loadOp:     'clear',
				clearValue: { r: 0, g: 0, b: 0, a: 1 },
				storeOp:    'store',
			},
		],
	});

	// Draw the grid.
	pass.setPipeline(cellPipeline);
	pass.setBindGroup(0, bindGroups[step % 2]!);
	pass.setVertexBuffer(0, vertexBuffer);
	pass.draw(vertices.length / 2, GRID_SIZE * GRID_SIZE);

	// End the render pass and submit the command buffer
	pass.end();

	device.queue.submit([ encoder.finish() ]);
}

// Schedule updateGrid() to run repeatedly
updateGrid();
setInterval(updateGrid, UPDATE_INTERVAL);
