// Copyright 2020 Brandon Jones
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { GPUTextureViewDimension, GPUIndexFormat, GPUFilterMode, GPUPrimitiveTopology, GPULoadOp, GPUStoreOp } from './constants.js';

// ported from https://github.com/toji/web-texture-tool/blob/master/src/webgpu-mipmap-generator.js

class WebGPUTextureUtils {

	constructor( device ) {

		this.device = device;

		const mipmapVertexSource = `
struct VarysStruct {
	@builtin( position ) Position: vec4<f32>,
	@location( 0 ) vTex : vec2<f32>
};

@vertex
fn main( @builtin( vertex_index ) vertexIndex : u32 ) -> VarysStruct {

	var Varys : VarysStruct;

	var pos = array< vec2<f32>, 4 >(
		vec2<f32>( -1.0,  1.0 ),
		vec2<f32>(  1.0,  1.0 ),
		vec2<f32>( -1.0, -1.0 ),
		vec2<f32>(  1.0, -1.0 )
	);

	var tex = array< vec2<f32>, 4 >(
		vec2<f32>( 0.0, 0.0 ),
		vec2<f32>( 1.0, 0.0 ),
		vec2<f32>( 0.0, 1.0 ),
		vec2<f32>( 1.0, 1.0 )
	);

	Varys.vTex = tex[ vertexIndex ];
	Varys.Position = vec4<f32>( pos[ vertexIndex ], 0.0, 1.0 );

	return Varys;

}
`;

		const mipmapFragmentSource = `
@group( 0 ) @binding( 0 )
var imgSampler : sampler;

@group( 0 ) @binding( 1 )
var img : texture_2d<f32>;

// Mipped Bicubic Texture Filtering by N8
// https://www.shadertoy.com/view/Dl2SDW

fn w0( a : f32 ) -> f32 {

	return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );

}

fn w1( a : f32 ) -> f32 {

	return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );

}

fn w2( a : f32 ) -> f32 {

	return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );

}

fn w3( a : f32 ) -> f32 {

	return ( 1.0 / 6.0 ) * ( a * a * a );

}

// g0 and g1 are the two amplitude functions
fn g0( a : f32 ) -> f32 {

	return w0( a ) + w1( a );

}

fn g1( a : f32 ) -> f32 {

	return w2( a ) + w3( a );

}

// h0 and h1 are the two offset functions
fn h0( a : f32 ) -> f32 {

	return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );

}

fn h1( a : f32 ) -> f32 {

	return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );

}

fn bicubic( uv : vec2<f32>, texelSize : vec4<f32>, lod : f32 ) -> vec4<f32> {

	var uv_scaled = uv * vec2(texelSize.zw) + vec2(0.5, 0.5);
  
	var iuv = floor(uv_scaled);
	var fuv = fract(uv_scaled);
  
	var g0x = g0(fuv.x);
	var g1x = g1(fuv.x);
	var h0x = h0(fuv.x);
	var h1x = h1(fuv.x);
	var h0y = h0(fuv.y);
	var h1y = h1(fuv.y);
  
	var p0 = (vec2(iuv.x + h0x, iuv.y + h0y) - vec2(0.5, 0.5)) * vec2(texelSize.xy);
	var p1 = (vec2(iuv.x + h1x, iuv.y + h0y) - vec2(0.5, 0.5)) * vec2(texelSize.xy);
	var p2 = (vec2(iuv.x + h0x, iuv.y + h1y) - vec2(0.5, 0.5)) * vec2(texelSize.xy);
	var p3 = (vec2(iuv.x + h1x, iuv.y + h1y) - vec2(0.5, 0.5)) * vec2(texelSize.xy);
  
	return g0(fuv.y) * (g0x * textureSampleLevel(img, imgSampler, p0, (lod) ).rgba +
						 g1x * textureSampleLevel(img, imgSampler, p1, (lod) ).rgba) +
		   g1(fuv.y) * (g0x * textureSampleLevel(img, imgSampler, p2, (lod) ).rgba +
						 g1x * textureSampleLevel(img, imgSampler, p3, (lod) ).rgba);

  }

fn textureBicubic( uv : vec2<f32>,  lod : f32 ) -> vec4<f32> {
    let fLodSize = vec2<f32>( textureDimensions( img, i32( lod ) ) );
    let cLodSize = vec2<f32>( textureDimensions( img, i32( lod + 1.0 ) ) );
    let fLodSizeInv = vec2<f32>(1.0) / fLodSize;
    let cLodSizeInv = vec2<f32>(1.0) / cLodSize;
    let fSample = bicubic( uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
    let cSample = bicubic( uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
    return mix( fSample, cSample, fract( lod ) );
}

//

@fragment
fn main( @location( 0 ) vTex : vec2<f32> ) -> @location( 0 ) vec4<f32> {

	return textureBicubic( vTex, 20.0 );
	//return textureSample( img, imgSampler, vTex );

}
`;

		this.sampler = device.createSampler( { minFilter: GPUFilterMode.Linear } );

		// We'll need a new pipeline for every texture format used.
		this.pipelines = {};

		this.mipmapVertexShaderModule = device.createShaderModule( {
			label: 'mipmapVertex',
			code: mipmapVertexSource
		} );

		this.mipmapFragmentShaderModule = device.createShaderModule( {
			label: 'mipmapFragment',
			code: mipmapFragmentSource
		} );

	}

	getMipmapPipeline( format ) {

		let pipeline = this.pipelines[ format ];

		if ( pipeline === undefined ) {

			pipeline = this.device.createRenderPipeline( {
				vertex: {
					module: this.mipmapVertexShaderModule,
					entryPoint: 'main'
				},
				fragment: {
					module: this.mipmapFragmentShaderModule,
					entryPoint: 'main',
					targets: [ { format } ]
				},
				primitive: {
					topology: GPUPrimitiveTopology.TriangleStrip,
					stripIndexFormat: GPUIndexFormat.Uint32
				},
				layout: 'auto'
			} );

			this.pipelines[ format ] = pipeline;

		}

		return pipeline;

	}

	generateMipmaps( textureGPU, textureGPUDescriptor, baseArrayLayer = 0 ) {

		const pipeline = this.getMipmapPipeline( textureGPUDescriptor.format );

		const commandEncoder = this.device.createCommandEncoder( {} );
		const bindGroupLayout = pipeline.getBindGroupLayout( 0 ); // @TODO: Consider making this static.

		let srcView = textureGPU.createView( {
			baseMipLevel: 0,
			mipLevelCount: 1,
			dimension: GPUTextureViewDimension.TwoD,
			baseArrayLayer
		} );

		for ( let i = 1; i < textureGPUDescriptor.mipLevelCount; i ++ ) {

			const dstView = textureGPU.createView( {
				baseMipLevel: i,
				mipLevelCount: 1,
				dimension: GPUTextureViewDimension.TwoD,
				baseArrayLayer
			} );

			const passEncoder = commandEncoder.beginRenderPass( {
				colorAttachments: [ {
					view: dstView,
					loadOp: GPULoadOp.Clear,
					storeOp: GPUStoreOp.Store,
					clearValue: [ 0, 0, 0, 0 ]
				} ]
			} );

			const bindGroup = this.device.createBindGroup( {
				layout: bindGroupLayout,
				entries: [ {
					binding: 0,
					resource: this.sampler
				}, {
					binding: 1,
					resource: srcView
				} ]
			} );

			passEncoder.setPipeline( pipeline );
			passEncoder.setBindGroup( 0, bindGroup );
			passEncoder.draw( 4, 1, 0, 0 );
			passEncoder.end();

			srcView = dstView;

		}

		this.device.queue.submit( [ commandEncoder.finish() ] );

	}

}

export default WebGPUTextureUtils;
