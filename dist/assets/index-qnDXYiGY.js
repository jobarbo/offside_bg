import{M as L,O as X,B as Z,F as R,S as m,U as _,V as F,W as y,H as S,N as E,C as q,a as J,b as T,c as $,P as ee,d as te,T as se,R as ie,e as re}from"./three-IOlhcSX_.js";(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))r(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&r(a)}).observe(document,{childList:!0,subtree:!0});function t(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function r(i){if(i.ep)return;i.ep=!0;const s=t(i);fetch(i.href,s)}})();const x={name:"CopyShader",uniforms:{tDiffuse:{value:null},opacity:{value:1}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float opacity;

		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {

			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = opacity * texel;


		}`};class p{constructor(){this.isPass=!0,this.enabled=!0,this.needsSwap=!0,this.clear=!1,this.renderToScreen=!1}setSize(){}render(){console.error("THREE.Pass: .render() must be implemented in derived pass.")}dispose(){}}const ae=new X(-1,1,1,-1,0,1);class ne extends Z{constructor(){super(),this.setAttribute("position",new R([-1,3,0,-1,-1,0,3,-1,0],3)),this.setAttribute("uv",new R([0,2,0,0,2,0],2))}}const oe=new ne;class D{constructor(e){this._mesh=new L(oe,e)}dispose(){this._mesh.geometry.dispose()}render(e){e.render(this._mesh,ae)}get material(){return this._mesh.material}set material(e){this._mesh.material=e}}class U extends p{constructor(e,t="tDiffuse"){super(),this.textureID=t,this.uniforms=null,this.material=null,e instanceof m?(this.uniforms=e.uniforms,this.material=e):e&&(this.uniforms=_.clone(e.uniforms),this.material=new m({name:e.name!==void 0?e.name:"unspecified",defines:Object.assign({},e.defines),uniforms:this.uniforms,vertexShader:e.vertexShader,fragmentShader:e.fragmentShader})),this._fsQuad=new D(this.material)}render(e,t,r){this.uniforms[this.textureID]&&(this.uniforms[this.textureID].value=r.texture),this._fsQuad.material=this.material,this.renderToScreen?(e.setRenderTarget(null),this._fsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),this._fsQuad.render(e))}dispose(){this.material.dispose(),this._fsQuad.dispose()}}class A extends p{constructor(e,t){super(),this.scene=e,this.camera=t,this.clear=!0,this.needsSwap=!1,this.inverse=!1}render(e,t,r){const i=e.getContext(),s=e.state;s.buffers.color.setMask(!1),s.buffers.depth.setMask(!1),s.buffers.color.setLocked(!0),s.buffers.depth.setLocked(!0);let a,c;this.inverse?(a=0,c=1):(a=1,c=0),s.buffers.stencil.setTest(!0),s.buffers.stencil.setOp(i.REPLACE,i.REPLACE,i.REPLACE),s.buffers.stencil.setFunc(i.ALWAYS,a,4294967295),s.buffers.stencil.setClear(c),s.buffers.stencil.setLocked(!0),e.setRenderTarget(r),this.clear&&e.clear(),e.render(this.scene,this.camera),e.setRenderTarget(t),this.clear&&e.clear(),e.render(this.scene,this.camera),s.buffers.color.setLocked(!1),s.buffers.depth.setLocked(!1),s.buffers.color.setMask(!0),s.buffers.depth.setMask(!0),s.buffers.stencil.setLocked(!1),s.buffers.stencil.setFunc(i.EQUAL,1,4294967295),s.buffers.stencil.setOp(i.KEEP,i.KEEP,i.KEEP),s.buffers.stencil.setLocked(!0)}}class le extends p{constructor(){super(),this.needsSwap=!1}render(e){e.state.buffers.stencil.setLocked(!1),e.state.buffers.stencil.setTest(!1)}}class he{constructor(e,t){if(this.renderer=e,this._pixelRatio=e.getPixelRatio(),t===void 0){const r=e.getSize(new F);this._width=r.width,this._height=r.height,t=new y(this._width*this._pixelRatio,this._height*this._pixelRatio,{type:S}),t.texture.name="EffectComposer.rt1"}else this._width=t.width,this._height=t.height;this.renderTarget1=t,this.renderTarget2=t.clone(),this.renderTarget2.texture.name="EffectComposer.rt2",this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2,this.renderToScreen=!0,this.passes=[],this.copyPass=new U(x),this.copyPass.material.blending=E,this.clock=new q}swapBuffers(){const e=this.readBuffer;this.readBuffer=this.writeBuffer,this.writeBuffer=e}addPass(e){this.passes.push(e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}insertPass(e,t){this.passes.splice(t,0,e),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}removePass(e){const t=this.passes.indexOf(e);t!==-1&&this.passes.splice(t,1)}isLastEnabledPass(e){for(let t=e+1;t<this.passes.length;t++)if(this.passes[t].enabled)return!1;return!0}render(e){e===void 0&&(e=this.clock.getDelta());const t=this.renderer.getRenderTarget();let r=!1;for(let i=0,s=this.passes.length;i<s;i++){const a=this.passes[i];if(a.enabled!==!1){if(a.renderToScreen=this.renderToScreen&&this.isLastEnabledPass(i),a.render(this.renderer,this.writeBuffer,this.readBuffer,e,r),a.needsSwap){if(r){const c=this.renderer.getContext(),l=this.renderer.state.buffers.stencil;l.setFunc(c.NOTEQUAL,1,4294967295),this.copyPass.render(this.renderer,this.writeBuffer,this.readBuffer,e),l.setFunc(c.EQUAL,1,4294967295)}this.swapBuffers()}A!==void 0&&(a instanceof A?r=!0:a instanceof le&&(r=!1))}}this.renderer.setRenderTarget(t)}reset(e){if(e===void 0){const t=this.renderer.getSize(new F);this._pixelRatio=this.renderer.getPixelRatio(),this._width=t.width,this._height=t.height,e=this.renderTarget1.clone(),e.setSize(this._width*this._pixelRatio,this._height*this._pixelRatio)}this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.renderTarget1=e,this.renderTarget2=e.clone(),this.writeBuffer=this.renderTarget1,this.readBuffer=this.renderTarget2}setSize(e,t){this._width=e,this._height=t;const r=this._width*this._pixelRatio,i=this._height*this._pixelRatio;this.renderTarget1.setSize(r,i),this.renderTarget2.setSize(r,i);for(let s=0;s<this.passes.length;s++)this.passes[s].setSize(r,i)}setPixelRatio(e){this._pixelRatio=e,this.setSize(this._width,this._height)}dispose(){this.renderTarget1.dispose(),this.renderTarget2.dispose(),this.copyPass.dispose()}}class ue extends p{constructor(e,t,r=null,i=null,s=null){super(),this.scene=e,this.camera=t,this.overrideMaterial=r,this.clearColor=i,this.clearAlpha=s,this.clear=!0,this.clearDepth=!1,this.needsSwap=!1,this._oldClearColor=new J}render(e,t,r){const i=e.autoClear;e.autoClear=!1;let s,a;this.overrideMaterial!==null&&(a=this.scene.overrideMaterial,this.scene.overrideMaterial=this.overrideMaterial),this.clearColor!==null&&(e.getClearColor(this._oldClearColor),e.setClearColor(this.clearColor,e.getClearAlpha())),this.clearAlpha!==null&&(s=e.getClearAlpha(),e.setClearAlpha(this.clearAlpha)),this.clearDepth==!0&&e.clearDepth(),e.setRenderTarget(this.renderToScreen?null:r),this.clear===!0&&e.clear(e.autoClearColor,e.autoClearDepth,e.autoClearStencil),e.render(this.scene,this.camera),this.clearColor!==null&&e.setClearColor(this._oldClearColor),this.clearAlpha!==null&&e.setClearAlpha(s),this.overrideMaterial!==null&&(this.scene.overrideMaterial=a),e.autoClear=i}}const g={uniforms:{damp:{value:.96},tOld:{value:null},tNew:{value:null}},vertexShader:`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,fragmentShader:`

		uniform float damp;

		uniform sampler2D tOld;
		uniform sampler2D tNew;

		varying vec2 vUv;

		vec4 when_gt( vec4 x, float y ) {

			return max( sign( x - y ), 0.0 );

		}

		void main() {

			vec4 texelOld = texture2D( tOld, vUv );
			vec4 texelNew = texture2D( tNew, vUv );

			texelOld *= damp * when_gt( texelOld, 0.1 );

			gl_FragColor = max(texelNew, texelOld);

		}`};class fe extends p{constructor(e=.96){super(),this.uniforms=_.clone(g.uniforms),this.uniforms.damp.value=e,this.compFsMaterial=new m({uniforms:this.uniforms,vertexShader:g.vertexShader,fragmentShader:g.fragmentShader}),this.copyFsMaterial=new m({uniforms:_.clone(x.uniforms),vertexShader:x.vertexShader,fragmentShader:x.fragmentShader,blending:E,depthTest:!1,depthWrite:!1}),this._textureComp=new y(window.innerWidth,window.innerHeight,{magFilter:T,type:S}),this._textureOld=new y(window.innerWidth,window.innerHeight,{magFilter:T,type:S}),this._compFsQuad=new D(this.compFsMaterial),this._copyFsQuad=new D(this.copyFsMaterial)}render(e,t,r){this.uniforms.tOld.value=this._textureOld.texture,this.uniforms.tNew.value=r.texture,e.setRenderTarget(this._textureComp),this._compFsQuad.render(e),this._copyFsQuad.material.uniforms.tDiffuse.value=this._textureComp.texture,this.renderToScreen?(e.setRenderTarget(null),this._copyFsQuad.render(e)):(e.setRenderTarget(t),this.clear&&e.clear(),this._copyFsQuad.render(e));const i=this._textureOld;this._textureOld=this._textureComp,this._textureComp=i}setSize(e,t){this._textureComp.setSize(e,t),this._textureOld.setSize(e,t)}dispose(){this._textureComp.dispose(),this._textureOld.dispose(),this.compFsMaterial.dispose(),this.copyFsMaterial.dispose(),this._compFsQuad.dispose(),this._copyFsQuad.dispose()}}const P=`varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,ce=`uniform sampler2D tDiffuse;
uniform float h;

varying vec2 vUv;

void main() {
    vec4 sum = vec4(0.0);

    // Gaussian blur weights
    sum += texture2D(tDiffuse, vec2(vUv.x - 4.0 * h, vUv.y)) * 0.051;
    sum += texture2D(tDiffuse, vec2(vUv.x - 3.0 * h, vUv.y)) * 0.0918;
    sum += texture2D(tDiffuse, vec2(vUv.x - 2.0 * h, vUv.y)) * 0.12245;
    sum += texture2D(tDiffuse, vec2(vUv.x - 1.0 * h, vUv.y)) * 0.1531;
    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y)) * 0.1633;
    sum += texture2D(tDiffuse, vec2(vUv.x + 1.0 * h, vUv.y)) * 0.1531;
    sum += texture2D(tDiffuse, vec2(vUv.x + 2.0 * h, vUv.y)) * 0.12245;
    sum += texture2D(tDiffuse, vec2(vUv.x + 3.0 * h, vUv.y)) * 0.0918;
    sum += texture2D(tDiffuse, vec2(vUv.x + 4.0 * h, vUv.y)) * 0.051;

    gl_FragColor = sum;
}`,de=`uniform sampler2D tDiffuse;
uniform float v;

varying vec2 vUv;

void main() {
    vec4 sum = vec4(0.0);

    // Gaussian blur weights
    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y - 4.0 * v)) * 0.051;
    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y - 3.0 * v)) * 0.0918;
    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y - 2.0 * v)) * 0.12245;
    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y - 1.0 * v)) * 0.1531;
    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y)) * 0.1633;
    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y + 1.0 * v)) * 0.1531;
    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y + 2.0 * v)) * 0.12245;
    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y + 3.0 * v)) * 0.0918;
    sum += texture2D(tDiffuse, vec2(vUv.x, vUv.y + 4.0 * v)) * 0.051;

    gl_FragColor = sum;
}`,ve=`uniform sampler2D map;
uniform float time;
varying vec2 vUv;

void main() {
    // Create animated UV coordinates
    vec2 animatedUv = vUv;

    // Add wave-like distortion
    animatedUv.x += sin(vUv.y * 10.0 + time * 2.0) * 0.02;
    animatedUv.y += cos(vUv.x * 10.0 + time * 2.0) * 0.02;

    // Add rotating motion
    float angle = time * 0.5;
    vec2 center = vec2(0.5, 0.5);
    vec2 uv = animatedUv - center;
    vec2 rotatedUv = vec2(
        uv.x * cos(angle) - uv.y * sin(angle),
        uv.x * sin(angle) + uv.y * cos(angle)
    );
    rotatedUv += center;

    // Sample texture with animated coordinates
    vec4 texel = texture2D(map, rotatedUv);

    // Convert to monochrome using standard luminance conversion
    float luminance = dot(texel.rgb, vec3(0.299, 0.587, 0.114));
    texel.rgb = vec3(luminance);

    // Add pulsing effect
    float pulse = sin(time * 3.0) * 0.1 + 0.9;
    texel.rgb *= pulse;

    gl_FragColor = texel;
}`,me="/assets/texture2-Cf8wNYQP.png",B=new $,d=new ee(75,window.innerWidth/window.innerHeight,.1,1e3),h=new te({antialias:!0,alpha:!0,precision:"highp"});h.setClearColor(0,0);h.autoClear=!1;h.setPixelRatio(window.devicePixelRatio);h.setSize(window.innerWidth,window.innerHeight);document.body.appendChild(h.domElement);const v=new he(h),pe=new ue(B,d);v.addPass(pe);const Q=new U({uniforms:{tDiffuse:{value:null},h:{value:1/window.innerWidth}},vertexShader:P,fragmentShader:ce});v.addPass(Q);const N=new U({uniforms:{tDiffuse:{value:null},v:{value:1/window.innerHeight}},vertexShader:P,fragmentShader:de});v.addPass(N);const xe=new fe(.994);v.addPass(xe);const ge=new se,C=ge.load(me);C.wrapS=C.wrapT=ie;const k=new m({uniforms:{map:{value:C},time:{value:.1}},vertexShader:P,fragmentShader:ve,transparent:!1,depthWrite:!0,depthTest:!0}),W=[],we=new re(1,1,1),w=.5,u=.001,_e=1.4,ye=.0015,O=2,z=.7;let o=0;for(let n=0;n<122;n++){const e=new L(we,k),t=n/122*Math.PI*2,r=_e+(Math.random()-.5)*.1;e.position.x=(Math.random()-.5)*1,e.position.y=(Math.random()-.5)*1,e.position.z=(Math.random()-.5)*2,e.userData.originalAngle=t,e.userData.radius=r,e.userData.offset=Math.random()*1e3,e.userData.verticalOffset=Math.random()*Math.PI*2,B.add(e),W.push(e)}d.position.z=12;d.position.x=0;d.position.y=0;function f(n,e,t){const r=Math.cos(n),i=Math.sin(e),s=Math.cos(t);return Math.cos(r+i+s)*.1}function I(){requestAnimationFrame(I),o+=1,k.uniforms.time.value=o*.01;const n=f(o*u,0,0)*w,e=f(0,o*u,0)*w,t=f(0,0,o*u)*w,r=n*Math.PI,i=e*Math.PI,s=t*Math.PI;W.forEach((a,c)=>{const l=a.userData.offset,H=a.userData.originalAngle,M=a.userData.radius,b=H+o*ye,V=Math.cos(b)*M,G=Math.sin(b)*M,j=f(o*u+l,0,l)*O,Y=f(0,o*u+l,l)*O,K=f(l,o*u,a.userData.verticalOffset)*111.5;a.position.x=V*z+j,a.position.y=G*z+Y,a.position.z=K,a.rotation.x=r+f(o*u,l,0)*Math.PI,a.rotation.y=i+f(l,o*u,0)*Math.PI,a.rotation.z=s+f(0,l,o*u)*Math.PI}),v.render()}window.addEventListener("resize",()=>{const n=window.innerWidth,e=window.innerHeight,t=window.devicePixelRatio;d.aspect=n/e,d.updateProjectionMatrix(),h.setSize(n,e),h.setPixelRatio(t),v.setSize(n,e),Q.uniforms.h.value=1/n,N.uniforms.v.value=1/e});I();h.sortObjects=!0;h.setClearColor(0,0);
