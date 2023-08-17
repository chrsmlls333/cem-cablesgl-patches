"use strict";

var CABLES=CABLES||{};
CABLES.OPS=CABLES.OPS||{};

var Ops=Ops || {};
Ops.Gl=Ops.Gl || {};
Ops.Ui=Ops.Ui || {};
Ops.Anim=Ops.Anim || {};
Ops.Date=Ops.Date || {};
Ops.Html=Ops.Html || {};
Ops.Json=Ops.Json || {};
Ops.Math=Ops.Math || {};
Ops.Time=Ops.Time || {};
Ops.User=Ops.User || {};
Ops.Vars=Ops.Vars || {};
Ops.Array=Ops.Array || {};
Ops.Debug=Ops.Debug || {};
Ops.Patch=Ops.Patch || {};
Ops.Value=Ops.Value || {};
Ops.Cables=Ops.Cables || {};
Ops.String=Ops.String || {};
Ops.Boolean=Ops.Boolean || {};
Ops.Devices=Ops.Devices || {};
Ops.Trigger=Ops.Trigger || {};
Ops.Website=Ops.Website || {};
Ops.TimeLine=Ops.TimeLine || {};
Ops.Extension=Ops.Extension || {};
Ops.Gl.Meshes=Ops.Gl.Meshes || {};
Ops.Gl.Shader=Ops.Gl.Shader || {};
Ops.Gl.Textures=Ops.Gl.Textures || {};
Ops.Math.Compare=Ops.Math.Compare || {};
Ops.Devices.Mouse=Ops.Devices.Mouse || {};
Ops.Patch.Pw01AEC=Ops.Patch.Pw01AEC || {};
Ops.Devices.Mobile=Ops.Devices.Mobile || {};
Ops.Devices.Keyboard=Ops.Devices.Keyboard || {};
Ops.Extension.FxHash=Ops.Extension.FxHash || {};
Ops.User.futuretense=Ops.User.futuretense || {};
Ops.Gl.TextureEffects=Ops.Gl.TextureEffects || {};
Ops.Gl.TextureEffects.Noise=Ops.Gl.TextureEffects.Noise || {};



// **************************************************************
// 
// Ops.Gl.MainLoop
// 
// **************************************************************

Ops.Gl.MainLoop = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    fpsLimit = op.inValue("FPS Limit", 0),
    trigger = op.outTrigger("trigger"),
    width = op.outNumber("width"),
    height = op.outNumber("height"),
    reduceFocusFPS = op.inValueBool("Reduce FPS not focussed", true),
    reduceLoadingFPS = op.inValueBool("Reduce FPS loading"),
    clear = op.inValueBool("Clear", true),
    clearAlpha = op.inValueBool("ClearAlpha", true),
    fullscreen = op.inValueBool("Fullscreen Button", false),
    active = op.inValueBool("Active", true),
    hdpi = op.inValueBool("Hires Displays", false),
    inUnit = op.inSwitch("Pixel Unit", ["Display", "CSS"], "Display");

op.onAnimFrame = render;
hdpi.onChange = function ()
{
    if (hdpi.get()) op.patch.cgl.pixelDensity = window.devicePixelRatio;
    else op.patch.cgl.pixelDensity = 1;

    op.patch.cgl.updateSize();
    if (CABLES.UI) gui.setLayout();

    // inUnit.setUiAttribs({ "greyout": !hdpi.get() });

    // if (!hdpi.get())inUnit.set("CSS");
    // else inUnit.set("Display");
};

active.onChange = function ()
{
    op.patch.removeOnAnimFrame(op);

    if (active.get())
    {
        op.setUiAttrib({ "extendTitle": "" });
        op.onAnimFrame = render;
        op.patch.addOnAnimFrame(op);
        op.log("adding again!");
    }
    else
    {
        op.setUiAttrib({ "extendTitle": "Inactive" });
    }
};

const cgl = op.patch.cgl;
let rframes = 0;
let rframeStart = 0;

if (!op.patch.cgl) op.uiAttr({ "error": "No webgl cgl context" });

const identTranslate = vec3.create();
vec3.set(identTranslate, 0, 0, 0);
const identTranslateView = vec3.create();
vec3.set(identTranslateView, 0, 0, -2);

fullscreen.onChange = updateFullscreenButton;
setTimeout(updateFullscreenButton, 100);
let fsElement = null;

let winhasFocus = true;
let winVisible = true;

window.addEventListener("blur", () => { winhasFocus = false; });
window.addEventListener("focus", () => { winhasFocus = true; });
document.addEventListener("visibilitychange", () => { winVisible = !document.hidden; });
testMultiMainloop();

inUnit.onChange = () =>
{
    width.set(0);
    height.set(0);
};

function getFpsLimit()
{
    if (reduceLoadingFPS.get() && op.patch.loading.getProgress() < 1.0) return 5;

    if (reduceFocusFPS.get())
    {
        if (!winVisible) return 10;
        if (!winhasFocus) return 30;
    }

    return fpsLimit.get();
}

function updateFullscreenButton()
{
    function onMouseEnter()
    {
        if (fsElement)fsElement.style.display = "block";
    }

    function onMouseLeave()
    {
        if (fsElement)fsElement.style.display = "none";
    }

    op.patch.cgl.canvas.addEventListener("mouseleave", onMouseLeave);
    op.patch.cgl.canvas.addEventListener("mouseenter", onMouseEnter);

    if (fullscreen.get())
    {
        if (!fsElement)
        {
            fsElement = document.createElement("div");

            const container = op.patch.cgl.canvas.parentElement;
            if (container)container.appendChild(fsElement);

            fsElement.addEventListener("mouseenter", onMouseEnter);
            fsElement.addEventListener("click", function (e)
            {
                if (CABLES.UI && !e.shiftKey) gui.cycleFullscreen();
                else cgl.fullScreen();
            });
        }

        fsElement.style.padding = "10px";
        fsElement.style.position = "absolute";
        fsElement.style.right = "5px";
        fsElement.style.top = "5px";
        fsElement.style.width = "20px";
        fsElement.style.height = "20px";
        fsElement.style.cursor = "pointer";
        fsElement.style["border-radius"] = "40px";
        fsElement.style.background = "#444";
        fsElement.style["z-index"] = "9999";
        fsElement.style.display = "none";
        fsElement.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" version=\"1.1\" id=\"Capa_1\" x=\"0px\" y=\"0px\" viewBox=\"0 0 490 490\" style=\"width:20px;height:20px;\" xml:space=\"preserve\" width=\"512px\" height=\"512px\"><g><path d=\"M173.792,301.792L21.333,454.251v-80.917c0-5.891-4.776-10.667-10.667-10.667C4.776,362.667,0,367.442,0,373.333V480     c0,5.891,4.776,10.667,10.667,10.667h106.667c5.891,0,10.667-4.776,10.667-10.667s-4.776-10.667-10.667-10.667H36.416     l152.459-152.459c4.093-4.237,3.975-10.99-0.262-15.083C184.479,297.799,177.926,297.799,173.792,301.792z\" fill=\"#FFFFFF\"/><path d=\"M480,0H373.333c-5.891,0-10.667,4.776-10.667,10.667c0,5.891,4.776,10.667,10.667,10.667h80.917L301.792,173.792     c-4.237,4.093-4.354,10.845-0.262,15.083c4.093,4.237,10.845,4.354,15.083,0.262c0.089-0.086,0.176-0.173,0.262-0.262     L469.333,36.416v80.917c0,5.891,4.776,10.667,10.667,10.667s10.667-4.776,10.667-10.667V10.667C490.667,4.776,485.891,0,480,0z\" fill=\"#FFFFFF\"/><path d=\"M36.416,21.333h80.917c5.891,0,10.667-4.776,10.667-10.667C128,4.776,123.224,0,117.333,0H10.667     C4.776,0,0,4.776,0,10.667v106.667C0,123.224,4.776,128,10.667,128c5.891,0,10.667-4.776,10.667-10.667V36.416l152.459,152.459     c4.237,4.093,10.99,3.975,15.083-0.262c3.992-4.134,3.992-10.687,0-14.82L36.416,21.333z\" fill=\"#FFFFFF\"/><path d=\"M480,362.667c-5.891,0-10.667,4.776-10.667,10.667v80.917L316.875,301.792c-4.237-4.093-10.99-3.976-15.083,0.261     c-3.993,4.134-3.993,10.688,0,14.821l152.459,152.459h-80.917c-5.891,0-10.667,4.776-10.667,10.667s4.776,10.667,10.667,10.667     H480c5.891,0,10.667-4.776,10.667-10.667V373.333C490.667,367.442,485.891,362.667,480,362.667z\" fill=\"#FFFFFF\"/></g></svg>";
    }
    else
    {
        if (fsElement)
        {
            fsElement.style.display = "none";
            fsElement.remove();
            fsElement = null;
        }
    }
}

op.onDelete = function ()
{
    cgl.gl.clearColor(0, 0, 0, 0);
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
};

function render(time)
{
    if (!active.get()) return;
    if (cgl.aborted || cgl.canvas.clientWidth === 0 || cgl.canvas.clientHeight === 0) return;

    op.patch.cg = cgl;

    const startTime = performance.now();

    op.patch.config.fpsLimit = getFpsLimit();

    if (cgl.canvasWidth == -1)
    {
        cgl.setCanvas(op.patch.config.glCanvasId);
        return;
    }

    if (cgl.canvasWidth != width.get() || cgl.canvasHeight != height.get())
    {
        let div = 1;
        if (inUnit.get() == "CSS")div = op.patch.cgl.pixelDensity;

        width.set(cgl.canvasWidth / div);
        height.set(cgl.canvasHeight / div);
    }

    if (CABLES.now() - rframeStart > 1000)
    {
        CGL.fpsReport = CGL.fpsReport || [];
        if (op.patch.loading.getProgress() >= 1.0 && rframeStart !== 0)CGL.fpsReport.push(rframes);
        rframes = 0;
        rframeStart = CABLES.now();
    }
    CGL.MESH.lastShader = null;
    CGL.MESH.lastMesh = null;

    cgl.renderStart(cgl, identTranslate, identTranslateView);

    if (clear.get())
    {
        cgl.gl.clearColor(0, 0, 0, 1);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
    }

    trigger.trigger();

    if (CGL.MESH.lastMesh)CGL.MESH.lastMesh.unBind();

    if (CGL.Texture.previewTexture)
    {
        if (!CGL.Texture.texturePreviewer) CGL.Texture.texturePreviewer = new CGL.Texture.texturePreview(cgl);
        CGL.Texture.texturePreviewer.render(CGL.Texture.previewTexture);
    }
    cgl.renderEnd(cgl);

    op.patch.cg = null;

    if (clearAlpha.get())
    {
        cgl.gl.clearColor(1, 1, 1, 1);
        cgl.gl.colorMask(false, false, false, true);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT);
        cgl.gl.colorMask(true, true, true, true);
    }

    if (!cgl.frameStore.phong)cgl.frameStore.phong = {};
    rframes++;

    op.patch.cgl.profileData.profileMainloopMs = performance.now() - startTime;
}

function testMultiMainloop()
{
    setTimeout(
        () =>
        {
            if (op.patch.getOpsByObjName(op.name).length > 1)
            {
                op.setUiError("multimainloop", "there should only be one mainloop op!");
                op.patch.addEventListener("onOpDelete", testMultiMainloop);
            }
            else op.setUiError("multimainloop", null, 1);
        }, 500);
}


};

Ops.Gl.MainLoop.prototype = new CABLES.Op();
CABLES.OPS["b0472a1d-db16-4ba6-8787-f300fbdc77bb"]={f:Ops.Gl.MainLoop,objName:"Ops.Gl.MainLoop"};




// **************************************************************
// 
// Ops.Math.DegreeToVector
// 
// **************************************************************

Ops.Math.DegreeToVector = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    deg = op.inValueFloat("degree", 0),
    x = op.outNumber("x"),
    y = op.outNumber("y");

deg.onChange = update;

function update()
{
    let rad = deg.get() * CGL.DEG2RAD;
    x.set(-1 * Math.sin(rad));
    y.set(Math.cos(rad));
}


};

Ops.Math.DegreeToVector.prototype = new CABLES.Op();
CABLES.OPS["56b1618b-4eed-41a8-87a2-57397ffc9029"]={f:Ops.Math.DegreeToVector,objName:"Ops.Math.DegreeToVector"};




// **************************************************************
// 
// Ops.Trigger.Sequence
// 
// **************************************************************

Ops.Trigger.Sequence = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe = op.inTrigger("exe"),
    cleanup = op.inTriggerButton("Clean up connections");

const
    exes = [],
    triggers = [],
    num = 16;

let
    updateTimeout = null,
    connectedOuts = [];

exe.onTriggered = triggerAll;
cleanup.onTriggered = clean;
cleanup.setUiAttribs({ "hideParam": true, "hidePort": true });

for (let i = 0; i < num; i++)
{
    const p = op.outTrigger("trigger " + i);
    triggers.push(p);
    p.onLinkChanged = updateButton;

    if (i < num - 1)
    {
        let newExe = op.inTrigger("exe " + i);
        newExe.onTriggered = triggerAll;
        exes.push(newExe);
    }
}

updateConnected();

function updateConnected()
{
    connectedOuts.length = 0;
    for (let i = 0; i < triggers.length; i++)
        if (triggers[i].links.length > 0) connectedOuts.push(triggers[i]);
}

function updateButton()
{
    updateConnected();
    clearTimeout(updateTimeout);
    updateTimeout = setTimeout(() =>
    {
        let show = false;
        for (let i = 0; i < triggers.length; i++)
            if (triggers[i].links.length > 1) show = true;

        cleanup.setUiAttribs({ "hideParam": !show });

        if (op.isCurrentUiOp()) op.refreshParams();
    }, 60);
}

function triggerAll()
{
    // for (let i = 0; i < triggers.length; i++) triggers[i].trigger();
    for (let i = 0; i < connectedOuts.length; i++) connectedOuts[i].trigger();
}

function clean()
{
    let count = 0;
    for (let i = 0; i < triggers.length; i++)
    {
        let removeLinks = [];

        if (triggers[i].links.length > 1)
            for (let j = 1; j < triggers[i].links.length; j++)
            {
                while (triggers[count].links.length > 0) count++;

                removeLinks.push(triggers[i].links[j]);
                const otherPort = triggers[i].links[j].getOtherPort(triggers[i]);
                op.patch.link(op, "trigger " + count, otherPort.parent, otherPort.name);
                count++;
            }

        for (let j = 0; j < removeLinks.length; j++) removeLinks[j].remove();
    }
    updateButton();
    updateConnected();
}


};

Ops.Trigger.Sequence.prototype = new CABLES.Op();
CABLES.OPS["a466bc1f-06e9-4595-8849-bffb9fe22f99"]={f:Ops.Trigger.Sequence,objName:"Ops.Trigger.Sequence"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.ImageCompose_v3
// 
// **************************************************************

Ops.Gl.TextureEffects.ImageCompose_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"imgcomp_frag":"IN vec2 texCoord;\nUNI vec4 bgColor;\nUNI sampler2D tex;\n#ifdef USE_UVTEX\nUNI sampler2D UVTex;\n#endif\n\nvoid main()\n{\n\n    #ifndef USE_TEX\n        outColor=bgColor;\n    #endif\n    #ifdef USE_TEX\n        #ifndef USE_UVTEX\n        outColor=texture(tex,texCoord);\n        #else\n        outColor=texture(tex,texture(UVTex,texCoord).xy);\n        #endif\n    #endif\n\n\n\n}\n",};
const
    cgl = op.patch.cgl,
    render = op.inTrigger("Render"),
    inTex = op.inTexture("Base Texture"),
    inUVTex = op.inTexture("UV Texture"),
    inSize = op.inSwitch("Size", ["Auto", "Manual"], "Auto"),
    width = op.inValueInt("Width", 640),
    height = op.inValueInt("Height", 480),
    inFilter = op.inSwitch("Filter", ["nearest", "linear", "mipmap"], "linear"),
    inWrap = op.inValueSelect("Wrap", ["clamp to edge", "repeat", "mirrored repeat"], "repeat"),
    inPixel = op.inDropDown("Pixel Format", CGL.Texture.PIXELFORMATS, CGL.Texture.PFORMATSTR_RGBA8UB),

    r = op.inValueSlider("R", 0),
    g = op.inValueSlider("G", 0),
    b = op.inValueSlider("B", 0),
    a = op.inValueSlider("A", 0),

    trigger = op.outTrigger("Next"),
    texOut = op.outTexture("texture_out", CGL.Texture.getEmptyTexture(cgl)),
    outRatio = op.outNumber("Aspect Ratio"),
    outWidth = op.outNumber("Texture Width"),
    outHeight = op.outNumber("Texture Height");

op.setPortGroup("Texture Size", [inSize, width, height]);
op.setPortGroup("Texture Parameters", [inWrap, inFilter, inPixel]);

r.setUiAttribs({ "colorPick": true });
op.setPortGroup("Color", [r, g, b, a]);

op.toWorkPortsNeedToBeLinked(render);

const prevViewPort = [0, 0, 0, 0];
let effect = null;
let tex = null;
let reInitEffect = true;
let isFloatTex = false;
let copyShader = null;
let copyShaderTexUni = null;
let copyShaderUVTexUni = null;
let copyShaderRGBAUni = null;

inWrap.onChange =
    inFilter.onChange =
    inPixel.onChange = reInitLater;

inTex.onLinkChanged =
inSize.onChange =
inUVTex.onChange = updateUi;

render.onTriggered =
    op.preRender = doRender;

updateUi();

function initEffect()
{
    if (effect)effect.delete();
    if (tex)tex.delete();

    effect = new CGL.TextureEffect(cgl, { "isFloatingPointTexture": getFloatingPoint() });

    tex = new CGL.Texture(cgl,
        {
            "name": "image_compose_v2_" + op.id,
            "isFloatingPointTexture": getFloatingPoint(),
            "filter": getFilter(),
            "wrap": getWrap(),
            "width": getWidth(),
            "height": getHeight()
        });

    effect.setSourceTexture(tex);

    outWidth.set(getWidth());
    outHeight.set(getHeight());
    outRatio.set(getWidth() / getHeight());

    texOut.set(CGL.Texture.getEmptyTexture(cgl));

    reInitEffect = false;
    updateUi();
}

function getFilter()
{
    if (inFilter.get() == "nearest") return CGL.Texture.FILTER_NEAREST;
    else if (inFilter.get() == "linear") return CGL.Texture.FILTER_LINEAR;
    else if (inFilter.get() == "mipmap") return CGL.Texture.FILTER_MIPMAP;
}

function getWrap()
{
    if (inWrap.get() == "repeat") return CGL.Texture.WRAP_REPEAT;
    else if (inWrap.get() == "mirrored repeat") return CGL.Texture.WRAP_MIRRORED_REPEAT;
    else if (inWrap.get() == "clamp to edge") return CGL.Texture.WRAP_CLAMP_TO_EDGE;
}

function getFloatingPoint()
{
    isFloatTex = inPixel.get() == CGL.Texture.PFORMATSTR_RGBA32F;
    return isFloatTex;
}

function getWidth()
{
    if (inTex.get() && inSize.get() == "Auto") return inTex.get().width;
    if (inSize.get() == "Auto") return cgl.getViewPort()[2];
    return Math.ceil(width.get());
}

function getHeight()
{
    if (inTex.get() && inSize.get() == "Auto") return inTex.get().height;
    else if (inSize.get() == "Auto") return cgl.getViewPort()[3];
    else return Math.ceil(height.get());
}

function reInitLater()
{
    reInitEffect = true;
}

function updateResolution()
{
    if ((
        getWidth() != tex.width ||
        getHeight() != tex.height ||
        tex.isFloatingPoint() != getFloatingPoint() ||
        tex.filter != getFilter() ||
        tex.wrap != getWrap()
    ) && (getWidth() !== 0 && getHeight() !== 0))
    {
        initEffect();
        effect.setSourceTexture(tex);
        texOut.set(CGL.Texture.getEmptyTexture(cgl));
        texOut.set(tex);
        updateResolutionInfo();
        checkTypes();
    }
}

function updateResolutionInfo()
{
    let info = null;

    if (inSize.get() == "Manual")
    {
        info = null;
    }
    else if (inSize.get() == "Auto")
    {
        if (inTex.get()) info = "Input Texture";
        else info = "Canvas Size";

        info += ": " + getWidth() + " x " + getHeight();
    }

    let changed = false;
    changed = inSize.uiAttribs.info != info;
    inSize.setUiAttribs({ "info": info });
    if (changed)op.refreshParams();
}

function updateDefines()
{
    if (copyShader)copyShader.toggleDefine("USE_TEX", inTex.isLinked());
    if (copyShader)copyShader.toggleDefine("USE_UVTEX", inUVTex.isLinked());
}

function updateUi()
{
    r.setUiAttribs({ "greyout": inTex.isLinked() });
    b.setUiAttribs({ "greyout": inTex.isLinked() });
    g.setUiAttribs({ "greyout": inTex.isLinked() });
    a.setUiAttribs({ "greyout": inTex.isLinked() });

    width.setUiAttribs({ "greyout": inSize.get() == "Auto" });
    height.setUiAttribs({ "greyout": inSize.get() == "Auto" });

    width.setUiAttribs({ "hideParam": inSize.get() != "Manual" });
    height.setUiAttribs({ "hideParam": inSize.get() != "Manual" });

    if (tex)
        if (getFloatingPoint() && getFilter() == CGL.Texture.FILTER_MIPMAP) op.setUiError("fpmipmap", "Don't use mipmap and 32bit at the same time, many systems do not support this.");
        else op.setUiError("fpmipmap", null);

    updateResolutionInfo();
    updateDefines();
    checkTypes();
}

function checkTypes()
{
    if (tex)
        if (inTex.isLinked() && inTex.get() && tex.textureType != inTex.get().textureType && (tex.textureType != CGL.Texture.TYPE_FLOAT || inTex.get().textureType == CGL.Texture.TYPE_FLOAT))
            op.setUiError("textypediff", "Drawing 32bit texture into an 8 bit can result in data/precision loss", 1);
        else
            op.setUiError("textypediff", null);
}

op.preRender = () =>
{
    doRender();
};

function copyTexture()
{
    if (!copyShader)
    {
        copyShader = new CGL.Shader(cgl, "copytextureshader");
        copyShader.setSource(copyShader.getDefaultVertexShader(), attachments.imgcomp_frag);
        copyShaderTexUni = new CGL.Uniform(copyShader, "t", "tex", 0);
        copyShaderUVTexUni = new CGL.Uniform(copyShader, "t", "UVTex", 1);
        copyShaderRGBAUni = new CGL.Uniform(copyShader, "4f", "bgColor", r, g, b, a);
        updateDefines();
    }

    cgl.pushShader(copyShader);
    cgl.currentTextureEffect.bind();

    if (inTex.get()) cgl.setTexture(0, inTex.get().tex);
    if (inUVTex.get()) cgl.setTexture(1, inUVTex.get().tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();
}

function doRender()
{
    if (!effect || reInitEffect) initEffect();

    const vp = cgl.getViewPort();
    prevViewPort[0] = vp[0];
    prevViewPort[1] = vp[1];
    prevViewPort[2] = vp[2];
    prevViewPort[3] = vp[3];

    cgl.pushBlend(false);

    updateResolution();

    const oldEffect = cgl.currentTextureEffect;
    cgl.currentTextureEffect = effect;
    cgl.currentTextureEffect.imgCompVer = 3;
    cgl.currentTextureEffect.width = width.get();
    cgl.currentTextureEffect.height = height.get();
    effect.setSourceTexture(tex);

    effect.startEffect(inTex.get() || CGL.Texture.getEmptyTexture(cgl, isFloatTex), true);
    copyTexture();

    trigger.trigger();

    // texOut.set(CGL.Texture.getEmptyTexture(cgl));

    texOut.setRef(effect.getCurrentSourceTexture());

    effect.endEffect();

    cgl.setViewPort(prevViewPort[0], prevViewPort[1], prevViewPort[2], prevViewPort[3]);

    cgl.popBlend(false);
    cgl.currentTextureEffect = oldEffect;
}


};

Ops.Gl.TextureEffects.ImageCompose_v3.prototype = new CABLES.Op();
CABLES.OPS["e890a050-11b7-456e-b09b-d08cd9c1ee41"]={f:Ops.Gl.TextureEffects.ImageCompose_v3,objName:"Ops.Gl.TextureEffects.ImageCompose_v3"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.DrawImage_v3
// 
// **************************************************************

Ops.Gl.TextureEffects.DrawImage_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"drawimage_frag":"#ifdef HAS_TEXTURES\n    IN vec2 texCoord;\n    UNI sampler2D tex;\n    UNI sampler2D image;\n#endif\n\n#ifdef TEX_TRANSFORM\n    IN mat3 transform;\n#endif\n// UNI float rotate;\n\n{{CGL.BLENDMODES}}\n\n#ifdef HAS_TEXTUREALPHA\n   UNI sampler2D imageAlpha;\n#endif\n\nUNI float amount;\n\n#ifdef ASPECT_RATIO\n    UNI float aspectTex;\n    UNI float aspectPos;\n#endif\n\nvoid main()\n{\n    vec4 blendRGBA=vec4(0.0,0.0,0.0,1.0);\n\n    #ifdef HAS_TEXTURES\n        vec2 tc=texCoord;\n\n        #ifdef TEX_FLIP_X\n            tc.x=1.0-tc.x;\n        #endif\n        #ifdef TEX_FLIP_Y\n            tc.y=1.0-tc.y;\n        #endif\n\n        #ifdef ASPECT_RATIO\n            #ifdef ASPECT_AXIS_X\n                tc.y=(1.0-aspectPos)-(((1.0-aspectPos)-tc.y)*aspectTex);\n            #endif\n            #ifdef ASPECT_AXIS_Y\n                tc.x=(1.0-aspectPos)-(((1.0-aspectPos)-tc.x)/aspectTex);\n            #endif\n        #endif\n\n        #ifdef TEX_TRANSFORM\n            vec3 coordinates=vec3(tc.x, tc.y,1.0);\n            tc=(transform * coordinates ).xy;\n        #endif\n\n        blendRGBA=texture(image,tc);\n\n        vec3 blend=blendRGBA.rgb;\n        vec4 baseRGBA=texture(tex,texCoord);\n        vec3 base=baseRGBA.rgb;\n\n\n        #ifdef PREMUL\n            blend.rgb = (blend.rgb) + (base.rgb * (1.0 - blendRGBA.a));\n        #endif\n\n        vec3 colNew=_blend(base,blend);\n\n\n\n\n        #ifdef REMOVE_ALPHA_SRC\n            blendRGBA.a=1.0;\n        #endif\n\n        #ifdef HAS_TEXTUREALPHA\n            vec4 colImgAlpha=texture(imageAlpha,tc);\n            float colImgAlphaAlpha=colImgAlpha.a;\n\n            #ifdef ALPHA_FROM_LUMINANCE\n                vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), colImgAlpha.rgb ));\n                colImgAlphaAlpha=(gray.r+gray.g+gray.b)/3.0;\n            #endif\n\n            #ifdef ALPHA_FROM_INV_UMINANCE\n                vec3 gray = vec3(dot(vec3(0.2126,0.7152,0.0722), colImgAlpha.rgb ));\n                colImgAlphaAlpha=1.0-(gray.r+gray.g+gray.b)/3.0;\n            #endif\n\n            #ifdef INVERT_ALPHA\n                colImgAlphaAlpha=clamp(colImgAlphaAlpha,0.0,1.0);\n                colImgAlphaAlpha=1.0-colImgAlphaAlpha;\n            #endif\n\n            blendRGBA.a=colImgAlphaAlpha*blendRGBA.a;\n        #endif\n    #endif\n\n    float am=amount;\n\n    #ifdef CLIP_REPEAT\n        if(tc.y>1.0 || tc.y<0.0 || tc.x>1.0 || tc.x<0.0)\n        {\n            // colNew.rgb=vec3(0.0);\n            am=0.0;\n        }\n    #endif\n\n    #ifdef ASPECT_RATIO\n        #ifdef ASPECT_CROP\n            if(tc.y>1.0 || tc.y<0.0 || tc.x>1.0 || tc.x<0.0)\n            {\n                colNew.rgb=base.rgb;\n                am=0.0;\n            }\n\n        #endif\n    #endif\n\n\n\n    #ifndef PREMUL\n        blendRGBA.rgb=mix(colNew,base,1.0-(am*blendRGBA.a));\n        blendRGBA.a=clamp(baseRGBA.a+(blendRGBA.a*am),0.,1.);\n    #endif\n\n    #ifdef PREMUL\n        // premultiply\n        // blendRGBA.rgb = (blendRGBA.rgb) + (baseRGBA.rgb * (1.0 - blendRGBA.a));\n        blendRGBA=vec4(\n            mix(colNew.rgb,base,1.0-(am*blendRGBA.a)),\n            blendRGBA.a*am+baseRGBA.a\n            );\n    #endif\n\n    #ifdef ALPHA_MASK\n    blendRGBA.a=baseRGBA.a;\n    #endif\n\n    outColor=blendRGBA;\n}\n\n\n\n\n\n\n\n","drawimage_vert":"IN vec3 vPosition;\nIN vec2 attrTexCoord;\nIN vec3 attrVertNormal;\n\nUNI mat4 projMatrix;\nUNI mat4 mvMatrix;\n\nOUT vec2 texCoord;\n// OUT vec3 norm;\n\n#ifdef TEX_TRANSFORM\n    UNI float posX;\n    UNI float posY;\n    UNI float scaleX;\n    UNI float scaleY;\n    UNI float rotate;\n    OUT mat3 transform;\n#endif\n\nvoid main()\n{\n   texCoord=attrTexCoord;\n//   norm=attrVertNormal;\n\n   #ifdef TEX_TRANSFORM\n        vec3 coordinates=vec3(attrTexCoord.x, attrTexCoord.y,1.0);\n        float angle = radians( rotate );\n        vec2 scale= vec2(scaleX,scaleY);\n        vec2 translate= vec2(posX,posY);\n\n        transform = mat3(   scale.x * cos( angle ), scale.x * sin( angle ), 0.0,\n            - scale.y * sin( angle ), scale.y * cos( angle ), 0.0,\n            - 0.5 * scale.x * cos( angle ) + 0.5 * scale.y * sin( angle ) - 0.5 * translate.x*2.0 + 0.5,  - 0.5 * scale.x * sin( angle ) - 0.5 * scale.y * cos( angle ) - 0.5 * translate.y*2.0 + 0.5, 1.0);\n   #endif\n\n   gl_Position = projMatrix * mvMatrix * vec4(vPosition,  1.0);\n}\n",};
const
    render = op.inTrigger("render"),
    blendMode = CGL.TextureEffect.AddBlendSelect(op, "blendMode"),
    amount = op.inValueSlider("amount", 1),

    image = op.inTexture("Image"),
    inAlphaPremul = op.inValueBool("Premultiplied", false),
    inAlphaMask = op.inValueBool("Alpha Mask", false),
    removeAlphaSrc = op.inValueBool("removeAlphaSrc", false),

    imageAlpha = op.inTexture("Mask"),
    alphaSrc = op.inValueSelect("Mask Src", ["alpha channel", "luminance", "luminance inv"], "luminance"),
    invAlphaChannel = op.inValueBool("Invert alpha channel"),

    inAspect = op.inValueBool("Aspect Ratio", false),
    inAspectAxis = op.inValueSelect("Stretch Axis", ["X", "Y"], "X"),
    inAspectPos = op.inValueSlider("Position", 0.0),
    inAspectCrop = op.inValueBool("Crop", false),

    trigger = op.outTrigger("trigger");

blendMode.set("normal");
const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, "drawimage");

imageAlpha.onLinkChanged = updateAlphaPorts;

op.setPortGroup("Mask", [imageAlpha, alphaSrc, invAlphaChannel]);
op.setPortGroup("Aspect Ratio", [inAspect, inAspectPos, inAspectCrop, inAspectAxis]);

function updateAlphaPorts()
{
    if (imageAlpha.isLinked())
    {
        removeAlphaSrc.setUiAttribs({ "greyout": true });
        alphaSrc.setUiAttribs({ "greyout": false });
        invAlphaChannel.setUiAttribs({ "greyout": false });
    }
    else
    {
        removeAlphaSrc.setUiAttribs({ "greyout": false });
        alphaSrc.setUiAttribs({ "greyout": true });
        invAlphaChannel.setUiAttribs({ "greyout": true });
    }
}

op.toWorkPortsNeedToBeLinked(image);

shader.setSource(attachments.drawimage_vert, attachments.drawimage_frag);

const
    textureUniform = new CGL.Uniform(shader, "t", "tex", 0),
    textureImaghe = new CGL.Uniform(shader, "t", "image", 1),
    textureAlpha = new CGL.Uniform(shader, "t", "imageAlpha", 2),
    uniTexAspect = new CGL.Uniform(shader, "f", "aspectTex", 1),
    uniAspectPos = new CGL.Uniform(shader, "f", "aspectPos", inAspectPos);

inAspect.onChange =
    inAspectCrop.onChange =
    inAspectAxis.onChange = updateAspectRatio;

function updateAspectRatio()
{
    shader.removeDefine("ASPECT_AXIS_X");
    shader.removeDefine("ASPECT_AXIS_Y");
    shader.removeDefine("ASPECT_CROP");

    inAspectPos.setUiAttribs({ "greyout": !inAspect.get() });
    inAspectCrop.setUiAttribs({ "greyout": !inAspect.get() });
    inAspectAxis.setUiAttribs({ "greyout": !inAspect.get() });

    if (inAspect.get())
    {
        shader.define("ASPECT_RATIO");

        if (inAspectCrop.get()) shader.define("ASPECT_CROP");

        if (inAspectAxis.get() == "X") shader.define("ASPECT_AXIS_X");
        if (inAspectAxis.get() == "Y") shader.define("ASPECT_AXIS_Y");
    }
    else
    {
        shader.removeDefine("ASPECT_RATIO");
        if (inAspectCrop.get()) shader.define("ASPECT_CROP");

        if (inAspectAxis.get() == "X") shader.define("ASPECT_AXIS_X");
        if (inAspectAxis.get() == "Y") shader.define("ASPECT_AXIS_Y");
    }
}

//
// texture flip
//
const flipX = op.inValueBool("flip x");
const flipY = op.inValueBool("flip y");

//
// texture transform
//

let doTransform = op.inValueBool("Transform");

let scaleX = op.inValueSlider("Scale X", 1);
let scaleY = op.inValueSlider("Scale Y", 1);

let posX = op.inValue("Position X", 0);
let posY = op.inValue("Position Y", 0);

let rotate = op.inValue("Rotation", 0);

const inClipRepeat = op.inValueBool("Clip Repeat", false);

const uniScaleX = new CGL.Uniform(shader, "f", "scaleX", scaleX);
const uniScaleY = new CGL.Uniform(shader, "f", "scaleY", scaleY);
const uniPosX = new CGL.Uniform(shader, "f", "posX", posX);
const uniPosY = new CGL.Uniform(shader, "f", "posY", posY);
const uniRotate = new CGL.Uniform(shader, "f", "rotate", rotate);

doTransform.onChange = updateTransformPorts;

function updateTransformPorts()
{
    shader.toggleDefine("TEX_TRANSFORM", doTransform.get());

    scaleX.setUiAttribs({ "greyout": !doTransform.get() });
    scaleY.setUiAttribs({ "greyout": !doTransform.get() });
    posX.setUiAttribs({ "greyout": !doTransform.get() });
    posY.setUiAttribs({ "greyout": !doTransform.get() });
    rotate.setUiAttribs({ "greyout": !doTransform.get() });
}

CGL.TextureEffect.setupBlending(op, shader, blendMode, amount);

const amountUniform = new CGL.Uniform(shader, "f", "amount", amount);

render.onTriggered = doRender;

inClipRepeat.onChange =
    imageAlpha.onChange =
    inAlphaPremul.onChange =
    inAlphaMask.onChange =
    invAlphaChannel.onChange =
    flipY.onChange =
    flipX.onChange =
    removeAlphaSrc.onChange =
    alphaSrc.onChange = updateDefines;

updateTransformPorts();
updateAlphaPorts();
updateAspectRatio();
updateDefines();

function updateDefines()
{
    shader.toggleDefine("REMOVE_ALPHA_SRC", removeAlphaSrc.get());
    shader.toggleDefine("ALPHA_MASK", inAlphaMask.get());

    shader.toggleDefine("CLIP_REPEAT", inClipRepeat.get());

    shader.toggleDefine("HAS_TEXTUREALPHA", imageAlpha.get() && imageAlpha.get().tex);

    shader.toggleDefine("TEX_FLIP_X", flipX.get());
    shader.toggleDefine("TEX_FLIP_Y", flipY.get());

    shader.toggleDefine("INVERT_ALPHA", invAlphaChannel.get());

    shader.toggleDefine("ALPHA_FROM_LUMINANCE", alphaSrc.get() == "luminance");
    shader.toggleDefine("ALPHA_FROM_INV_UMINANCE", alphaSrc.get() == "luminance_inv");
    shader.toggleDefine("PREMUL", inAlphaPremul.get());
}

function doRender()
{
    if (!CGL.TextureEffect.checkOpInEffect(op)) return;

    const tex = image.get();
    if (tex && tex.tex && amount.get() > 0.0)
    {
        cgl.pushShader(shader);
        cgl.currentTextureEffect.bind();

        const imgTex = cgl.currentTextureEffect.getCurrentSourceTexture();
        cgl.setTexture(0, imgTex.tex);

        if (imgTex && tex)
        {
            if (tex.textureType != imgTex.textureType && (tex.textureType == CGL.Texture.TYPE_FLOAT))
                op.setUiError("textypediff", "Drawing 32bit texture into an 8 bit can result in data/precision loss", 1);
            else
                op.setUiError("textypediff", null);
        }

        const asp = 1 / (cgl.currentTextureEffect.getWidth() / cgl.currentTextureEffect.getHeight()) * (tex.width / tex.height);
        // uniTexAspect.setValue(1 / (tex.height / tex.width * imgTex.width / imgTex.height));

        uniTexAspect.setValue(asp);

        cgl.setTexture(1, tex.tex);
        // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, image.get().tex );

        if (imageAlpha.get() && imageAlpha.get().tex)
        {
            cgl.setTexture(2, imageAlpha.get().tex);
            // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, imageAlpha.get().tex );
        }

        // cgl.pushBlend(false);

        cgl.pushBlendMode(CGL.BLEND_NONE, true);

        cgl.currentTextureEffect.finish();
        cgl.popBlendMode();

        // cgl.popBlend();

        cgl.popShader();
    }

    trigger.trigger();
}


};

Ops.Gl.TextureEffects.DrawImage_v3.prototype = new CABLES.Op();
CABLES.OPS["8f6b2f15-fcb0-4597-90c0-e5173f2969fe"]={f:Ops.Gl.TextureEffects.DrawImage_v3,objName:"Ops.Gl.TextureEffects.DrawImage_v3"};




// **************************************************************
// 
// Ops.Gl.Meshes.FullscreenRectangle
// 
// **************************************************************

Ops.Gl.Meshes.FullscreenRectangle = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"shader_frag":"UNI sampler2D tex;\nIN vec2 texCoord;\n\nvoid main()\n{\n    outColor= texture(tex,texCoord);\n}\n\n","shader_vert":"{{MODULES_HEAD}}\n\nIN vec3 vPosition;\nUNI mat4 projMatrix;\nUNI mat4 mvMatrix;\n\nOUT vec2 texCoord;\nIN vec2 attrTexCoord;\n\nvoid main()\n{\n   vec4 pos=vec4(vPosition,  1.0);\n\n   texCoord=vec2(attrTexCoord.x,(1.0-attrTexCoord.y));\n\n   gl_Position = projMatrix * mvMatrix * pos;\n}\n",};
const
    render = op.inTrigger("render"),
    inScale = op.inSwitch("Scale", ["Stretch", "Fit"], "Fit"),
    flipY = op.inValueBool("Flip Y"),
    flipX = op.inValueBool("Flip X"),
    inTexture = op.inTexture("Texture"),
    trigger = op.outTrigger("trigger");

const cgl = op.patch.cgl;
let mesh = null;
let geom = new CGL.Geometry("fullscreen rectangle");
let x = 0, y = 0, z = 0, w = 0, h = 0;

op.toWorkShouldNotBeChild("Ops.Gl.TextureEffects.ImageCompose", CABLES.OP_PORT_TYPE_FUNCTION);
op.toWorkPortsNeedToBeLinked(render);

flipX.onChange = rebuildFlip;
flipY.onChange = rebuildFlip;
render.onTriggered = doRender;
inTexture.onLinkChanged = updateUi;
inScale.onChange = updateScale;

const shader = new CGL.Shader(cgl, "fullscreenrectangle");
shader.setModules(["MODULE_VERTEX_POSITION", "MODULE_COLOR", "MODULE_BEGIN_FRAG"]);

shader.setSource(attachments.shader_vert, attachments.shader_frag);
shader.fullscreenRectUniform = new CGL.Uniform(shader, "t", "tex", 0);
shader.aspectUni = new CGL.Uniform(shader, "f", "aspectTex", 0);

let useShader = false;
let updateShaderLater = true;
let fitImageAspect = false;
let oldVp = [];

updateUi();
updateScale();

inTexture.onChange = function ()
{
    updateShaderLater = true;
};

function updateUi()
{
    if (!CABLES.UI) return;
    flipY.setUiAttribs({ "greyout": !inTexture.isLinked() });
    flipX.setUiAttribs({ "greyout": !inTexture.isLinked() });
    inScale.setUiAttribs({ "greyout": !inTexture.isLinked() });
}

function updateShader()
{
    let tex = inTexture.get();
    if (tex) useShader = true;
    else useShader = false;
}

op.preRender = function ()
{
    updateShader();
    shader.bind();
    if (mesh)mesh.render(shader);
    doRender();
};

function updateScale()
{
    fitImageAspect = inScale.get() == "Fit";
}

function doRender()
{
    if (cgl.getViewPort()[2] != w || cgl.getViewPort()[3] != h || !mesh) rebuild();

    if (updateShaderLater) updateShader();

    cgl.pushPMatrix();
    mat4.identity(cgl.pMatrix);
    mat4.ortho(cgl.pMatrix, 0, w, h, 0, -10.0, 1000);

    cgl.pushModelMatrix();
    mat4.identity(cgl.mMatrix);

    cgl.pushViewMatrix();
    mat4.identity(cgl.vMatrix);

    if (fitImageAspect && inTexture.get())
    {
        const rat = inTexture.get().width / inTexture.get().height;

        let _h = h;
        let _w = h * rat;

        if (_w > w)
        {
            _h = w * 1 / rat;
            _w = w;
        }

        oldVp[0] = cgl.getViewPort()[0];
        oldVp[1] = cgl.getViewPort()[1];
        oldVp[2] = cgl.getViewPort()[2];
        oldVp[3] = cgl.getViewPort()[3];

        cgl.setViewPort((w - _w) / 2, (h - _h) / 2, _w, _h);
    }

    if (useShader)
    {
        if (inTexture.get())
            cgl.setTexture(0, inTexture.get().tex);

        mesh.render(shader);
    }
    else
    {
        mesh.render(cgl.getShader());
    }

    // if (trigger.isLinked())
    cgl.gl.clear(cgl.gl.DEPTH_BUFFER_BIT);

    cgl.popPMatrix();
    cgl.popModelMatrix();
    cgl.popViewMatrix();

    if (fitImageAspect && inTexture.get())
        cgl.setViewPort(oldVp[0], oldVp[1], oldVp[2], oldVp[3]);

    trigger.trigger();
}

function rebuildFlip()
{
    mesh = null;
}

function rebuild()
{
    const currentViewPort = cgl.getViewPort();

    if (currentViewPort[2] == w && currentViewPort[3] == h && mesh) return;

    let xx = 0, xy = 0;

    w = currentViewPort[2];
    h = currentViewPort[3];

    geom.vertices = new Float32Array([
        xx + w, xy + h, 0.0,
        xx, xy + h, 0.0,
        xx + w, xy, 0.0,
        xx, xy, 0.0
    ]);

    let tc = null;

    if (flipY.get())
        tc = new Float32Array([
            1.0, 0.0,
            0.0, 0.0,
            1.0, 1.0,
            0.0, 1.0
        ]);
    else
        tc = new Float32Array([
            1.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            0.0, 0.0
        ]);

    if (flipX.get())
    {
        tc[0] = 0.0;
        tc[2] = 1.0;
        tc[4] = 0.0;
        tc[6] = 1.0;
    }

    geom.setTexCoords(tc);

    geom.verticesIndices = new Uint16Array([
        2, 1, 0,
        3, 1, 2
    ]);

    geom.vertexNormals = new Float32Array([
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
        0, 0, 1,
    ]);
    geom.tangents = new Float32Array([
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0,
        -1, 0, 0]);
    geom.biTangents == new Float32Array([
        0, -1, 0,
        0, -1, 0,
        0, -1, 0,
        0, -1, 0]);

    if (!mesh) mesh = new CGL.Mesh(cgl, geom);
    else mesh.setGeom(geom);
}


};

Ops.Gl.Meshes.FullscreenRectangle.prototype = new CABLES.Op();
CABLES.OPS["255bd15b-cc91-4a12-9b4e-53c710cbb282"]={f:Ops.Gl.Meshes.FullscreenRectangle,objName:"Ops.Gl.Meshes.FullscreenRectangle"};




// **************************************************************
// 
// Ops.Vars.VarGetTexture_v2
// 
// **************************************************************

Ops.Vars.VarGetTexture_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const val = op.outTexture("Value");
op.varName = op.inValueSelect("Variable", [], "", true);

new CABLES.VarGetOpWrapper(op, "object", op.varName, val);


};

Ops.Vars.VarGetTexture_v2.prototype = new CABLES.Op();
CABLES.OPS["5f8ce5fc-9787-45c9-9a83-0eebd2c6de15"]={f:Ops.Vars.VarGetTexture_v2,objName:"Ops.Vars.VarGetTexture_v2"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.ScrollTexture
// 
// **************************************************************

Ops.Gl.TextureEffects.ScrollTexture = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"scroll_frag":"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI float amountX;\nUNI float amountY;\n\n#ifdef HAS_MASK\n    UNI sampler2D texMask;\n#endif\n\nvoid main()\n{\n    float amX=amountX;\n    float amY=amountY;\n\n    #ifdef HAS_MASK\n        vec4 m=texture(texMask,texCoord);\n\n\n        amX*=(m.r-0.5)*2.0;\n        amY*=(m.g-0.5)*2.0;\n    #endif\n\n    vec4 col=vec4(0.0,0.0,0.0,1.0);\n    float x=mod(texCoord.x+amX,1.0);\n    float y=mod(texCoord.y+amY,1.0);\n\n\n    #ifdef NO_REPEAT\n        x=texCoord.x+amX*0.1;\n        y=texCoord.y+amY*0.1;\n    #endif\n\n    col=texture(tex,vec2(x,y));\n\n    #ifdef NO_REPEAT\n        if(x>1.0 || x<0.0 || y>1.0 || y<0.0) col=vec4(0.0,0.0,0.0,0.0);\n    #endif\n    outColor= col;\n}",};
const
    render = op.inTrigger("render"),
    trigger = op.outTrigger("trigger"),
    amountX = op.inValue("amountX"),
    amountY = op.inValue("amountY"),
    textureMask = op.inTexture("Mask"),
    repeat = op.inValueBool("Repeat", true);

repeat.onChange = updateRepeat;

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, op.name);
shader.setSource(shader.getDefaultVertexShader(), attachments.scroll_frag);

const
    textureUniform = new CGL.Uniform(shader, "t", "tex", 0),
    amountXUniform = new CGL.Uniform(shader, "f", "amountX", amountX),
    amountYUniform = new CGL.Uniform(shader, "f", "amountY", amountY),
    unitexMask = new CGL.Uniform(shader, "t", "texMask", 1);

updateRepeat();

textureMask.onChange = function ()
{
    if (textureMask.get())shader.define("MASK");
    else shader.removeDefine("MASK");
};

function updateRepeat()
{
    if (!repeat.get())shader.define("NO_REPEAT");
    else shader.removeDefine("NO_REPEAT");
}

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);
    if (textureMask.get()) cgl.setTexture(1, textureMask.get().tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.TextureEffects.ScrollTexture.prototype = new CABLES.Op();
CABLES.OPS["9b151d99-7888-4948-81c7-cd23b334e8d4"]={f:Ops.Gl.TextureEffects.ScrollTexture,objName:"Ops.Gl.TextureEffects.ScrollTexture"};




// **************************************************************
// 
// Ops.Math.Divide
// 
// **************************************************************

Ops.Math.Divide = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    number1 = op.inValueFloat("number1", 1),
    number2 = op.inValueFloat("number2", 2),
    result = op.outNumber("result");

op.setTitle("/");

number1.onChange = number2.onChange = exec;
exec();

function exec()
{
    result.set(number1.get() / number2.get());
}


};

Ops.Math.Divide.prototype = new CABLES.Op();
CABLES.OPS["86fcfd8c-038d-4b91-9820-a08114f6b7eb"]={f:Ops.Math.Divide,objName:"Ops.Math.Divide"};




// **************************************************************
// 
// Ops.Math.Multiply
// 
// **************************************************************

Ops.Math.Multiply = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    number1 = op.inValueFloat("number1", 1),
    number2 = op.inValueFloat("number2", 2),
    result = op.outNumber("result");

op.setTitle("*");

number1.onChange = number2.onChange = update;
update();

function update()
{
    const n1 = number1.get();
    const n2 = number2.get();

    result.set(n1 * n2);
}


};

Ops.Math.Multiply.prototype = new CABLES.Op();
CABLES.OPS["1bbdae06-fbb2-489b-9bcc-36c9d65bd441"]={f:Ops.Math.Multiply,objName:"Ops.Math.Multiply"};




// **************************************************************
// 
// Ops.Anim.Smooth
// 
// **************************************************************

Ops.Anim.Smooth = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exec = op.inTrigger("Update"),
    inMode = op.inBool("Separate inc/dec", false),
    inVal = op.inValue("Value"),
    next = op.outTrigger("Next"),
    inDivisorUp = op.inValue("Inc factor", 4),
    inDivisorDown = op.inValue("Dec factor", 4),
    result = op.outNumber("Result", 0);

let val = 0;
let goal = 0;
let oldVal = 0;
let lastTrigger = 0;

op.toWorkPortsNeedToBeLinked(exec);

let divisorUp;
let divisorDown;
let divisor = 4;
let finished = true;

let selectIndex = 0;
const MODE_SINGLE = 0;
const MODE_UP_DOWN = 1;

onFilterChange();
getDivisors();

inMode.setUiAttribs({ "hidePort": true });

inDivisorUp.onChange = inDivisorDown.onChange = getDivisors;
inMode.onChange = onFilterChange;
update();

function onFilterChange()
{
    const selectedMode = inMode.get();
    if (!selectedMode) selectIndex = MODE_SINGLE;
    else selectIndex = MODE_UP_DOWN;

    if (selectIndex == MODE_SINGLE)
    {
        inDivisorDown.setUiAttribs({ "greyout": true });
        inDivisorUp.setUiAttribs({ "title": "Inc/Dec factor" });
    }
    else if (selectIndex == MODE_UP_DOWN)
    {
        inDivisorDown.setUiAttribs({ "greyout": false });
        inDivisorUp.setUiAttribs({ "title": "Inc factor" });
    }

    getDivisors();
    update();
}

function getDivisors()
{
    if (selectIndex == MODE_SINGLE)
    {
        divisorUp = inDivisorUp.get();
        divisorDown = inDivisorUp.get();
    }
    else if (selectIndex == MODE_UP_DOWN)
    {
        divisorUp = inDivisorUp.get();
        divisorDown = inDivisorDown.get();
    }

    if (divisorUp <= 0.2 || divisorUp != divisorUp)divisorUp = 0.2;
    if (divisorDown <= 0.2 || divisorDown != divisorDown)divisorDown = 0.2;
}

inVal.onChange = function ()
{
    finished = false;
    let oldGoal = goal;
    goal = inVal.get();
};

inDivisorUp.onChange = function ()
{
    getDivisors();
};

function update()
{
    let tm = 1;
    if (performance.now() - lastTrigger > 500 || lastTrigger === 0) val = inVal.get() || 0;
    else tm = (performance.now() - lastTrigger) / (performance.now() - lastTrigger);
    lastTrigger = performance.now();

    if (val != val)val = 0;

    if (divisor <= 0)divisor = 0.0001;

    const diff = goal - val;

    if (diff >= 0) val += (diff) / (divisorDown * tm);
    else val += (diff) / (divisorUp * tm);

    if (Math.abs(diff) < 0.00001)val = goal;

    if (divisor != divisor)val = 0;
    if (val != val || val == -Infinity || val == Infinity)val = inVal.get();

    if (oldVal != val)
    {
        result.set(val);
        oldVal = val;
    }

    if (val == goal && !finished)
    {
        finished = true;
        result.set(val);
    }

    next.trigger();
}

exec.onTriggered = function ()
{
    update();
};


};

Ops.Anim.Smooth.prototype = new CABLES.Op();
CABLES.OPS["5677b5b5-753a-4fbf-9e91-64c81ec68a2f"]={f:Ops.Anim.Smooth,objName:"Ops.Anim.Smooth"};




// **************************************************************
// 
// Ops.Math.Round
// 
// **************************************************************

Ops.Math.Round = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    number1 = op.inValueFloat("number"),
    decPlaces = op.inInt("Decimal Places", 0),
    result = op.outNumber("result");

let decm = 0;

number1.onChange = exec;
decPlaces.onChange = updateDecm;

updateDecm();

function updateDecm()
{
    decm = Math.pow(10, decPlaces.get());
    exec();
}

function exec()
{
    result.set(Math.round(number1.get() * decm) / decm);
}


};

Ops.Math.Round.prototype = new CABLES.Op();
CABLES.OPS["1a1ef636-6d02-42ba-ae1e-627b917d0d2b"]={f:Ops.Math.Round,objName:"Ops.Math.Round"};




// **************************************************************
// 
// Ops.Value.Number
// 
// **************************************************************

Ops.Value.Number = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    v = op.inValueFloat("value"),
    result = op.outNumber("result");

v.onChange = exec;

function exec()
{
    result.set(Number(v.get()));
}


};

Ops.Value.Number.prototype = new CABLES.Op();
CABLES.OPS["8fb2bb5d-665a-4d0a-8079-12710ae453be"]={f:Ops.Value.Number,objName:"Ops.Value.Number"};




// **************************************************************
// 
// Ops.Value.SwitchNumber
// 
// **************************************************************

Ops.Value.SwitchNumber = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const idx = op.inValueInt("Index");
const valuePorts = [];
const result = op.outNumber("Result");

idx.onChange = update;

for (let i = 0; i < 16; i++)
{
    let p = op.inValue("Value " + i);
    valuePorts.push(p);
    p.onChange = update;
}

function update()
{
    if (idx.get() >= 0 && valuePorts[idx.get()])
    {
        result.set(valuePorts[idx.get()].get());
    }
}


};

Ops.Value.SwitchNumber.prototype = new CABLES.Op();
CABLES.OPS["fbb89f72-f2e3-4d34-ad01-7d884a1bcdc0"]={f:Ops.Value.SwitchNumber,objName:"Ops.Value.SwitchNumber"};




// **************************************************************
// 
// Ops.Array.Array_v3
// 
// **************************************************************

Ops.Array.Array_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inLength = op.inValueInt("Array length", 10),
    modeSelect = op.inSwitch("Mode select", ["Number", "1,2,3,4", "0-1"], "Number"),
    inDefaultValue = op.inValueFloat("Default Value"),
    inReverse = op.inBool("Reverse", false),
    outArr = op.outArray("Array"),
    outArrayLength = op.outNumber("Array length out");

let arr = [];
let selectIndex = 0;
const MODE_NUMBER = 0;
const MODE_1_TO_4 = 1;
const MODE_0_TO_1 = 2;

modeSelect.onChange = onFilterChange;

inReverse.onChange =
    inDefaultValue.onChange =
    inLength.onChange = reset;

onFilterChange();
reset();

function onFilterChange()
{
    let selectedMode = modeSelect.get();
    if (selectedMode === "Number") selectIndex = MODE_NUMBER;
    else if (selectedMode === "1,2,3,4") selectIndex = MODE_1_TO_4;
    else if (selectedMode === "0-1") selectIndex = MODE_0_TO_1;

    inDefaultValue.setUiAttribs({ "greyout": selectIndex !== MODE_NUMBER });

    op.setUiAttrib({ "extendTitle": modeSelect.get() });

    reset();
}

function reset()
{
    arr.length = 0;

    let arrLength = inLength.get();
    let valueForArray = inDefaultValue.get();
    let i;

    // mode 0 - fill all array values with one number
    if (selectIndex === MODE_NUMBER)
    {
        for (i = 0; i < arrLength; i++)
        {
            arr[i] = valueForArray;
        }
    }
    // mode 1 Continuous number array - increments up to array length
    else if (selectIndex === MODE_1_TO_4)
    {
        for (i = 0; i < arrLength; i++)
        {
            arr[i] = i;
        }
    }
    // mode 2 Normalized array
    else if (selectIndex === MODE_0_TO_1)
    {
        for (i = 0; i < arrLength; i++)
        {
            arr[i] = i / (arrLength - 1);
        }
    }

    if (inReverse.get())arr = arr.reverse();

    outArr.setRef(arr);
    outArrayLength.set(arr.length);
}


};

Ops.Array.Array_v3.prototype = new CABLES.Op();
CABLES.OPS["e4d31a46-bf64-42a8-be34-4cbb2bbc2600"]={f:Ops.Array.Array_v3,objName:"Ops.Array.Array_v3"};




// **************************************************************
// 
// Ops.Array.ArrayMultiply
// 
// **************************************************************

Ops.Array.ArrayMultiply = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inArray = op.inArray("In"),
    inValue = op.inValue("Value", 1.0),
    outArray = op.outArray("Result");

let newArr = [];
outArray.set(newArr);
inArray.onChange =
inValue.onChange = inArray.onChange = function ()
{
    let arr = inArray.get();
    if (!arr) return;

    let mul = inValue.get();

    if (newArr.length != arr.length)newArr.length = arr.length;

    for (let i = 0; i < arr.length; i++) newArr[i] = arr[i] * mul;

    outArray.setRef(newArr);
};

inArray.onLinkChanged = () =>
{
    if (inArray) inArray.copyLinkedUiAttrib("stride", outArray);
};


};

Ops.Array.ArrayMultiply.prototype = new CABLES.Op();
CABLES.OPS["a01c344b-4129-4b01-9c8f-36cefe86d7cc"]={f:Ops.Array.ArrayMultiply,objName:"Ops.Array.ArrayMultiply"};




// **************************************************************
// 
// Ops.Ui.VizNumber
// 
// **************************************************************

Ops.Ui.VizNumber = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const inNum = op.inFloat("Number", 0);
const outNum = op.outNumber("Result");

op.setUiAttrib({ "widthOnlyGrow": true });

inNum.onChange = () =>
{
    let n = inNum.get();
    if (op.patch.isEditorMode())
    {
        let str = "";
        if (n === null)str = "null";
        else if (n === undefined)str = "undefined";
        else
        {
            str = "" + Math.round(n * 10000) / 10000;

            if (str[0] != "-")str = " " + str;
        }

        op.setUiAttribs({ "extendTitle": str });
    }

    outNum.set(n);
};


};

Ops.Ui.VizNumber.prototype = new CABLES.Op();
CABLES.OPS["2b60d12d-2884-4ad0-bda4-0caeb6882f5c"]={f:Ops.Ui.VizNumber,objName:"Ops.Ui.VizNumber"};




// **************************************************************
// 
// Ops.Math.MapRange
// 
// **************************************************************

Ops.Math.MapRange = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    v = op.inValueFloat("value", 0),
    old_min = op.inValueFloat("old min", 0),
    old_max = op.inValueFloat("old max", 1),
    new_min = op.inValueFloat("new min", -1),
    new_max = op.inValueFloat("new max", 1),
    easing = op.inValueSelect("Easing", ["Linear", "Smoothstep", "Smootherstep"], "Linear"),
    result = op.outNumber("result", 0);

op.setPortGroup("Input Range", [old_min, old_max]);
op.setPortGroup("Output Range", [new_min, new_max]);

let ease = 0;
let r = 0;

v.onChange =
    old_min.onChange =
    old_max.onChange =
    new_min.onChange =
    new_max.onChange = exec;

exec();

easing.onChange = function ()
{
    if (easing.get() == "Smoothstep") ease = 1;
    else if (easing.get() == "Smootherstep") ease = 2;
    else ease = 0;
};

function exec()
{
    const nMin = new_min.get();
    const nMax = new_max.get();
    const oMin = old_min.get();
    const oMax = old_max.get();
    let x = v.get();

    if (x >= Math.max(oMax, oMin))
    {
        result.set(nMax);
        return;
    }
    else
    if (x <= Math.min(oMax, oMin))
    {
        result.set(nMin);
        return;
    }

    let reverseInput = false;
    const oldMin = Math.min(oMin, oMax);
    const oldMax = Math.max(oMin, oMax);
    if (oldMin != oMin) reverseInput = true;

    let reverseOutput = false;
    const newMin = Math.min(nMin, nMax);
    const newMax = Math.max(nMin, nMax);
    if (newMin != nMin) reverseOutput = true;

    let portion = 0;

    if (reverseInput) portion = (oldMax - x) * (newMax - newMin) / (oldMax - oldMin);
    else portion = (x - oldMin) * (newMax - newMin) / (oldMax - oldMin);

    if (reverseOutput) r = newMax - portion;
    else r = portion + newMin;

    if (ease === 0)
    {
        result.set(r);
    }
    else
    if (ease == 1)
    {
        x = Math.max(0, Math.min(1, (r - nMin) / (nMax - nMin)));
        result.set(nMin + x * x * (3 - 2 * x) * (nMax - nMin)); // smoothstep
    }
    else
    if (ease == 2)
    {
        x = Math.max(0, Math.min(1, (r - nMin) / (nMax - nMin)));
        result.set(nMin + x * x * x * (x * (x * 6 - 15) + 10) * (nMax - nMin)); // smootherstep
    }
}


};

Ops.Math.MapRange.prototype = new CABLES.Op();
CABLES.OPS["2617b407-60a0-4ff6-b4a7-18136cfa7817"]={f:Ops.Math.MapRange,objName:"Ops.Math.MapRange"};




// **************************************************************
// 
// Ops.TimeLine.TimeLinePlayer
// 
// **************************************************************

Ops.TimeLine.TimeLinePlayer = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    play = op.inTriggerButton("Play"),
    pause = op.inTriggerButton("Pause"),
    rewind = op.inTriggerButton("rewind"),
    setTime = op.inFloat("Set current time", 0),

    outPlayTrigger = op.outTrigger("play trigger"),
    outPauseTrigger = op.outTrigger("pause trigger"),
    outrewindTrigger = op.outTrigger("rewind trigger"),
    isPlaying = op.outBool("is Playing"),
    outSetTimeTrigger = op.outNumber("set time (seconds)"),
    currentTime = op.outNumber("current time"),
    currentFrame = op.outNumber("current frame");

play.onTriggered = function ()
{
    op.patch.timer.play();

    op.patch.timer.setTime(setTime.get());
    outSetTimeTrigger.set(setTime.get());
    outPlayTrigger.trigger();
};

pause.onTriggered = function ()
{
    op.patch.timer.pause();
    outPauseTrigger.trigger();
};

op.onAnimFrame = function (time)
{
    currentFrame.set(Math.round(time * 30.0));
    currentTime.set(time);
    isPlaying.set(op.patch.timer.isPlaying());
};

rewind.onTriggered = function ()
{
    op.patch.timer.setTime(0);
    outrewindTrigger.trigger();
};


};

Ops.TimeLine.TimeLinePlayer.prototype = new CABLES.Op();
CABLES.OPS["97e57613-6a51-41cf-9de5-fe3dbc2c69b2"]={f:Ops.TimeLine.TimeLinePlayer,objName:"Ops.TimeLine.TimeLinePlayer"};




// **************************************************************
// 
// Ops.Vars.VarGetNumber_v2
// 
// **************************************************************

Ops.Vars.VarGetNumber_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const val = op.outNumber("Value");
op.varName = op.inValueSelect("Variable", [], "", true);

new CABLES.VarGetOpWrapper(op, "number", op.varName, val);


};

Ops.Vars.VarGetNumber_v2.prototype = new CABLES.Op();
CABLES.OPS["421f5b52-c0fa-47c4-8b7a-012b9e1c864a"]={f:Ops.Vars.VarGetNumber_v2,objName:"Ops.Vars.VarGetNumber_v2"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.RepeatTexture_v2
// 
// **************************************************************

Ops.Gl.TextureEffects.RepeatTexture_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"repeat_frag":"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI sampler2D mulTex;\nUNI float amount;\nUNI float amountX;\nUNI float amountY;\n\n{{CGL.BLENDMODES3}}\n\nvoid main()\n{\n    float am=amount;\n\n    float mul=1.0;\n\n    #ifdef HAS_MASK\n        mul=texture(mulTex,texCoord).r;\n    #endif\n\n    vec2 coord = vec2(\n        mod(texCoord.x*amountX*mul,1.0),\n        mod(texCoord.y*amountY*mul,1.0));\n\n    vec4 col=texture(tex,coord);\n    vec4 base=texture(tex,texCoord);\n\n\n    #ifdef CLEAR\n        base.a=0.0;\n    #endif\n\n    outColor=cgl_blendPixel(base,col,am);\n}",};
const
    render = op.inTrigger("render"),
    blendMode = CGL.TextureEffect.AddBlendSelect(op, "Blend Mode", "normal"),
    amount = op.inValueSlider("Amount", 1),
    amountX = op.inValue("x", 3),
    amountY = op.inValue("y", 3),
    trigger = op.outTrigger("trigger"),
    inClear=op.inBool("Clear",true),
    mulTex = op.inTexture("Multiply");

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, op.name);

shader.setSource(shader.getDefaultVertexShader(), attachments.repeat_frag);

const
    textureUniform = new CGL.Uniform(shader, "t", "tex", 0),
    textureMulUniform = new CGL.Uniform(shader, "t", "mulTex", 2),
    amountUniform = new CGL.Uniform(shader, "f", "amount", amount),
    amountXUniform = new CGL.Uniform(shader, "f", "amountX", amountX),
    amountYUniform = new CGL.Uniform(shader, "f", "amountY", amountY);

CGL.TextureEffect.setupBlending(op, shader, blendMode, amount);

inClear.onChange =
mulTex.onChange =updateDefines;

function updateDefines()
{

    shader.toggleDefine("CLEAR", inClear.get());
    shader.toggleDefine("HAS_MASK", mulTex.get());
}

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op,3)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);
    if (mulTex.get())cgl.setTexture(2, mulTex.get().tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.TextureEffects.RepeatTexture_v2.prototype = new CABLES.Op();
CABLES.OPS["ff9aa796-d781-444c-a9d4-a62157f82dd5"]={f:Ops.Gl.TextureEffects.RepeatTexture_v2,objName:"Ops.Gl.TextureEffects.RepeatTexture_v2"};




// **************************************************************
// 
// Ops.Gl.Shader.CustomShader_v2
// 
// **************************************************************

Ops.Gl.Shader.CustomShader_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    render = op.inTrigger("render"),
    fragmentShader = op.inStringEditor("Fragment Code"),
    vertexShader = op.inStringEditor("Vertex Code"),
    asMaterial = op.inValueBool("Use As Material", true),
    trigger = op.outTrigger("trigger"),
    outShader = op.outObject("Shader", null, "shader"),
    outErrors = op.outBool("Has Errors");

const cgl = op.patch.cgl;
const uniformInputs = [];
const uniformTextures = [];
const vectors = [];

op.toWorkPortsNeedToBeLinked(render);

fragmentShader.setUiAttribs({ "editorSyntax": "glsl" });
vertexShader.setUiAttribs({ "editorSyntax": "glsl" });

const shader = new CGL.Shader(cgl, op.name);

shader.setModules(["MODULE_VERTEX_POSITION", "MODULE_COLOR", "MODULE_BEGIN_FRAG"]);

op.setPortGroup("Source Code", [fragmentShader, vertexShader]);
op.setPortGroup("Options", [asMaterial]);

fragmentShader.set(CGL.Shader.getDefaultFragmentShader());
vertexShader.set(CGL.Shader.getDefaultVertexShader());

fragmentShader.onChange = vertexShader.onChange = function ()
{
    if (fragmentShader.isLinked() && !fragmentShader.get()) return;
    needsUpdate = true;
};

render.onTriggered = doRender;

let needsUpdate = true;
op.onLoadedValueSet = initDataOnLoad;

function initDataOnLoad(data)
{
    updateShader();

    // set uniform values AFTER shader has been compiled and uniforms are extracted and uniform ports are created.
    for (let i = 0; i < uniformInputs.length; i++)
        for (let j = 0; j < data.portsIn.length; j++)
            if (uniformInputs[i] && uniformInputs[i].name == data.portsIn[j].name)
            {
                uniformInputs[i].set(data.portsIn[j].value);
                uniformInputs[i].deSerializeSettings(data.portsIn[j]);
            }
}

op.init = function ()
{
    updateShader();
};

function doRender()
{
    setVectorValues();
    if (needsUpdate)updateShader();
    if (asMaterial.get()) cgl.pushShader(shader);
    pushTextures();
    trigger.trigger();
    shader.popTextures();
    if (asMaterial.get()) cgl.popShader();
}

function pushTextures()
{
    for (let i = 0; i < uniformTextures.length; i++)
        if (uniformTextures[i] && uniformTextures[i].get() && uniformTextures[i].get().tex)
            shader.pushTexture(uniformTextures[i].uniform, uniformTextures[i].get().tex);
        else
            shader.pushTexture(uniformTextures[i], CGL.Texture.getEmptyTexture(cgl));
}

function bindTextures()// old - should be removed in next version ?
{
    for (let i = 0; i < uniformTextures.length; i++)
        if (uniformTextures[i] && uniformTextures[i].get() && uniformTextures[i].get().tex)
            cgl.setTexture(0 + i + 3, uniformTextures[i].get().tex);
}

function hasUniformInput(name)
{
    for (let i = 0; i < uniformInputs.length; i++) if (uniformInputs[i] && uniformInputs[i].name == name) return true;
    for (let i = 0; i < uniformTextures.length; i++) if (uniformTextures[i] && uniformTextures[i].name == name) return true;
    return false;
}

const tempMat4 = mat4.create();
const uniformNameBlacklist = [
    "modelMatrix",
    "viewMatrix",
    "normalMatrix",
    "mvMatrix",
    "projMatrix",
    "inverseViewMatrix",
    "camPos"
];

let countTexture = 0;
const foundNames = [];

function parseUniforms(src)
{
    const lblines = src.split("\n");
    const groupUniforms = [];

    for (let k = 0; k < lblines.length; k++)
    {
        const lines = lblines[k].split(";");

        for (let i = 0; i < lines.length; i++)
        {
            let words = lines[i].split(" ");

            for (let j = 0; j < words.length; j++) words[j] = (words[j] + "").trim();

            if (words[0] === "UNI" || words[0] === "uniform")
            {
                let varnames = words[2];
                if (words.length > 4) for (let j = 3; j < words.length; j++)varnames += words[j];

                words = words.filter(function (el) { return el !== ""; });
                const type = words[1];

                let names = [varnames];
                if (varnames.indexOf(",") > -1) names = varnames.split(",");

                for (let l = 0; l < names.length; l++)
                {
                    if (uniformNameBlacklist.indexOf(names[l]) > -1) continue;
                    const uniName = names[l].trim().replace(/\[\d+\]$/, "");

                    if (type === "float")
                    {
                        foundNames.push(uniName);
                        if (!hasUniformInput(uniName))
                        {
                            const arrayMatch = names[l].trim().match(/\[\d+\]$/);
                            if (arrayMatch)
                            {
                                const arrayLength = parseInt(arrayMatch[0].trim().slice(1, -1));

                                const newInput = op.inArray(uniName, []);
                                newInput.uniform = new CGL.Uniform(shader, "f[]", uniName, new Float32Array(arrayLength));
                                uniformInputs.push(newInput);
                                groupUniforms.push(newInput);

                                const vec = {
                                    "name": uniName,
                                    "num": arrayLength,
                                    "port": newInput,
                                    "uni": newInput.uniform,
                                    "changed": false
                                };
                                newInput.onChange = function () { this.changed = true; }.bind(vec);

                                vectors.push(vec);
                            }
                            else
                            {
                                const newInput = op.inFloat(uniName, 0);
                                newInput.uniform = new CGL.Uniform(shader, "f", uniName, newInput);
                                uniformInputs.push(newInput);
                                groupUniforms.push(newInput);
                            }
                        }
                    }
                    else if (type === "int")
                    {
                        foundNames.push(uniName);
                        if (!hasUniformInput(uniName))
                        {
                            const newInput = op.inInt(uniName, 0);
                            newInput.uniform = new CGL.Uniform(shader, "i", uniName, newInput);
                            uniformInputs.push(newInput);
                            groupUniforms.push(newInput);
                        }
                    }
                    else if (type === "bool")
                    {
                        foundNames.push(uniName);
                        if (!hasUniformInput(uniName))
                        {
                            const newInput = op.inBool(uniName, false);
                            newInput.uniform = new CGL.Uniform(shader, "b", uniName, newInput);
                            uniformInputs.push(newInput);
                            groupUniforms.push(newInput);
                        }
                    }
                    else if (type === "mat4")
                    {
                        foundNames.push(uniName);
                        if (!hasUniformInput(uniName))
                        {
                            const newInput = op.inArray(uniName, 0);
                            newInput.uniform = new CGL.Uniform(shader, "m4", uniName, newInput);
                            uniformInputs.push(newInput);
                            groupUniforms.push(newInput);

                            const vec = {
                                "name": uniName,
                                "num": 16,
                                "port": newInput,
                                "uni": newInput.uniform,
                                "changed": false
                            };
                            newInput.onChange = function () { this.changed = true; }.bind(vec);

                            vectors.push(vec);
                        }
                    }
                    else if (type === "sampler2D" || type === "samplerCube")
                    {
                        foundNames.push(uniName);
                        if (!hasUniformInput(uniName))
                        {
                            const newInputTex = op.inObject(uniName);

                            let uniType = "t";
                            if (type === "samplerCube")uniType = "tc";

                            newInputTex.uniform = new CGL.Uniform(shader, uniType, uniName, 3 + uniformTextures.length);
                            uniformTextures.push(newInputTex);
                            groupUniforms.push(newInputTex);
                            newInputTex.set(CGL.Texture.getTempTexture(cgl));
                            newInputTex.on("change", (v, p) =>
                            {
                                if (!v)p.set(CGL.Texture.getTempTexture(cgl));
                            });
                            countTexture++;
                        }
                    }
                    else if (type === "vec3" || type === "vec2" || type === "vec4")
                    {
                        let num = 2;
                        if (type === "vec4")num = 4;
                        if (type === "vec3")num = 3;
                        foundNames.push(uniName + " X");
                        foundNames.push(uniName + " Y");
                        if (num > 2)foundNames.push(uniName + " Z");
                        if (num > 3)foundNames.push(uniName + " W");

                        if (!hasUniformInput(uniName + " X"))
                        {
                            const group = [];
                            const vec = {
                                "name": uniName,
                                "num": num,
                                "changed": false,
                            };
                            vectors.push(vec);
                            initVectorUniform(vec);

                            const newInputX = op.inFloat(uniName + " X", 0);
                            newInputX.onChange = function () { this.changed = true; }.bind(vec);
                            uniformInputs.push(newInputX);
                            group.push(newInputX);
                            vec.x = newInputX;

                            const newInputY = op.inFloat(uniName + " Y", 0);
                            newInputY.onChange = function () { this.changed = true; }.bind(vec);
                            uniformInputs.push(newInputY);
                            group.push(newInputY);
                            vec.y = newInputY;

                            if (num > 2)
                            {
                                const newInputZ = op.inFloat(uniName + " Z", 0);
                                newInputZ.onChange = function () { this.changed = true; }.bind(vec);
                                uniformInputs.push(newInputZ);
                                group.push(newInputZ);
                                vec.z = newInputZ;
                            }
                            if (num > 3)
                            {
                                const newInputW = op.inFloat(uniName + " W", 0);
                                newInputW.onChange = function () { this.changed = true; }.bind(vec);
                                uniformInputs.push(newInputW);
                                group.push(newInputW);
                                vec.w = newInputW;
                            }

                            op.setPortGroup(uniName, group);
                        }
                    }
                }
            }
        }
    }
    op.setPortGroup("uniforms", groupUniforms);
}

function updateShader()
{
    if (!shader) return;

    shader.bindTextures = bindTextures.bind(this);
    shader.setSource(vertexShader.get(), fragmentShader.get());

    if (cgl.glVersion == 1)
    {
        cgl.enableExtension("OES_standard_derivatives");
        // cgl.enableExtension('OES_texture_float');
        // cgl.enableExtension('OES_texture_float_linear');
        // cgl.enableExtension('OES_texture_half_float');
        // cgl.enableExtension('OES_texture_half_float_linear');

        shader.enableExtension("GL_OES_standard_derivatives");
    // shader.enableExtension("GL_OES_texture_float");
    // shader.enableExtension("GL_OES_texture_float_linear");
    // shader.enableExtension("GL_OES_texture_half_float");
    // shader.enableExtension("GL_OES_texture_half_float_linear");
    }

    countTexture = 0;
    foundNames.length = 0;

    parseUniforms(vertexShader.get());
    parseUniforms(fragmentShader.get());

    for (let j = 0; j < uniformTextures.length; j++)
        for (let i = 0; i < foundNames.length; i++)
            if (uniformTextures[j] && foundNames.indexOf(uniformTextures[j].name) == -1)
            {
                uniformTextures[j].remove();
                uniformTextures[j] = null;
            }

    for (let j = 0; j < uniformInputs.length; j++)
        for (let i = 0; i < foundNames.length; i++)
            if (uniformInputs[j] && foundNames.indexOf(uniformInputs[j].name) == -1)
            {
                uniformInputs[j].remove();
                uniformInputs[j] = null;
            }

    for (let j = 0; j < vectors.length; j++)
    {
        initVectorUniform(vectors[j]);
        vectors[j].changed = true;
    }

    for (let i = 0; i < uniformInputs.length; i++)
        if (uniformInputs[i] && uniformInputs[i].uniform)uniformInputs[i].uniform.needsUpdate = true;

    shader.compile();

    op.refreshParams();

    outShader.set(null);
    outShader.set(shader);
    needsUpdate = false;

    if (shader.hasErrors()) op.setUiError("compile", "Shader has errors");
    else op.setUiError("compile", null);

    outErrors.set(shader.hasErrors());
}

function initVectorUniform(vec)
{
    if (vec.num == 2) vec.uni = new CGL.Uniform(shader, "2f", vec.name, [0, 0]);
    else if (vec.num == 3) vec.uni = new CGL.Uniform(shader, "3f", vec.name, [0, 0, 0]);
    else if (vec.num == 4) vec.uni = new CGL.Uniform(shader, "4f", vec.name, [0, 0, 0, 0]);
}

function setVectorValues()
{
    for (let i = 0; i < vectors.length; i++)
    {
        const v = vectors[i];
        if (v.changed)
        {
            if (v.num === 2) v.uni.setValue([v.x.get(), v.y.get()]);
            else if (v.num === 3) v.uni.setValue([v.x.get(), v.y.get(), v.z.get()]);
            else if (v.num === 4) v.uni.setValue([v.x.get(), v.y.get(), v.z.get(), v.w.get()]);

            else if (v.num > 4)
            {
                v.uni.setValue(v.port.get());
            }

            v.changed = false;
        }
    }
}


};

Ops.Gl.Shader.CustomShader_v2.prototype = new CABLES.Op();
CABLES.OPS["a165fc89-a35b-4d39-8930-7345b098bd9d"]={f:Ops.Gl.Shader.CustomShader_v2,objName:"Ops.Gl.Shader.CustomShader_v2"};




// **************************************************************
// 
// Ops.Gl.Shader.Shader2Texture
// 
// **************************************************************

Ops.Gl.Shader.Shader2Texture = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exec = op.inTrigger("Render"),
    inShader = op.inObject("Shader", null, "shader"),
    inVPSize = op.inValueBool("Use Viewport Size", true),
    inWidth = op.inValueInt("Width", 512),
    inHeight = op.inValueInt("Height", 512),
    tfilter = op.inValueSelect("filter", ["nearest", "linear", "mipmap"]),
    twrap = op.inValueSelect("wrap", ["clamp to edge", "repeat", "mirrored repeat"], "clamp to edge"),
    inFloatingPoint = op.inValueBool("Floating Point", false),
    inNumTex = op.inSwitch("Num Textures", ["1", "4"], "1"),
    next = op.outTrigger("Next"),
    outTex = op.outTexture("Texture"),
    outTex2 = op.outTexture("Texture 2"),
    outTex3 = op.outTexture("Texture 3"),
    outTex4 = op.outTexture("Texture 4");

op.setPortGroup("Texture Size", [inVPSize, inWidth, inHeight]);
op.setPortGroup("Texture settings", [tfilter, twrap, inFloatingPoint]);

let numTextures = 1;
const cgl = op.patch.cgl;
const prevViewPort = [0, 0, 0, 0];
const effect = null;
const drawBuffArr = [];
let lastShader = null;
let shader = null;

inWidth.onChange =
    inHeight.onChange =
    inFloatingPoint.onChange =
    tfilter.onChange =
    inNumTex.onChange =
    twrap.onChange = initFbLater;

inVPSize.onChange = updateUI;

const showingError = false;

let fb = null;
const tex = null;
let needInit = true;

const mesh = CGL.MESHES.getSimpleRect(cgl, "shader2texture rect");

op.toWorkPortsNeedToBeLinked(inShader);

tfilter.set("nearest");

updateUI();

function warning()
{
    if (tfilter.get() == "mipmap" && inFloatingPoint.get())
    {
        op.setUiError("warning", "HDR and mipmap filtering at the same time is not possible");
    }
    else
    {
        op.setUiError("warning", null);
    }
}

function updateUI()
{
    inWidth.setUiAttribs({ "greyout": inVPSize.get() });
    inHeight.setUiAttribs({ "greyout": inVPSize.get() });

    inWidth.set(cgl.getViewPort()[2]);
    inHeight.set(cgl.getViewPort()[3]);
}

function initFbLater()
{
    needInit = true;
    warning();
}

function resetShader()
{
    if (shader) shader.dispose();
    lastShader = null;
    shader = null;
}

function initFb()
{
    needInit = false;
    if (fb)fb.delete();

    const oldLen = drawBuffArr.length;
    numTextures = parseInt(inNumTex.get());
    drawBuffArr.length = 0;
    for (let i = 0; i < numTextures; i++)drawBuffArr[i] = true;

    if (oldLen != drawBuffArr.length)
    {
        resetShader();
    }

    fb = null;

    let w = inWidth.get();
    let h = inHeight.get();

    if (inVPSize.get())
    {
        w = cgl.getViewPort()[2];
        h = cgl.getViewPort()[3];
    }

    let filter = CGL.Texture.FILTER_NEAREST;
    if (tfilter.get() == "linear") filter = CGL.Texture.FILTER_LINEAR;
    else if (tfilter.get() == "mipmap") filter = CGL.Texture.FILTER_MIPMAP;

    let selectedWrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;
    if (twrap.get() == "repeat") selectedWrap = CGL.Texture.WRAP_REPEAT;
    if (twrap.get() == "mirrored repeat") selectedWrap = CGL.Texture.WRAP_MIRRORED_REPEAT;

    if (cgl.glVersion >= 2)
    {
        fb = new CGL.Framebuffer2(cgl, w, h,
            {
                "isFloatingPointTexture": inFloatingPoint.get(),
                "multisampling": false,
                "numRenderBuffers": numTextures,
                "wrap": selectedWrap,
                "filter": filter,
                "depth": true,
                "multisamplingSamples": 0,
                "clear": true
            });
    }
    else
    {
        fb = new CGL.Framebuffer(cgl, inWidth.get(), inHeight.get(),
            {
                "isFloatingPointTexture": inFloatingPoint.get(),
                "filter": filter,
                "wrap": selectedWrap
            });
    }
}

exec.onTriggered = function ()
{
    const vp = cgl.getViewPort();

    if (!fb || needInit)initFb();
    if (inVPSize.get() && fb && (vp[2] != fb.getTextureColor().width || vp[3] != fb.getTextureColor().height)) initFb();

    if (!inShader.get() || !inShader.get().setDrawBuffers) return;

    if (inShader.get() != lastShader)
    {
        lastShader = inShader.get();
        shader = inShader.get().copy();

        shader.setDrawBuffers(drawBuffArr);
    }

    if (!shader)
    {
        outTex.set(null);
        return;
    }

    prevViewPort[0] = vp[0];
    prevViewPort[1] = vp[1];
    prevViewPort[2] = vp[2];
    prevViewPort[3] = vp[3];

    fb.renderStart(cgl);

    cgl.pushPMatrix();
    mat4.identity(cgl.pMatrix);

    cgl.pushViewMatrix();
    mat4.identity(cgl.vMatrix);

    cgl.pushModelMatrix();
    mat4.identity(cgl.mMatrix);

    cgl.pushShader(inShader.get());
    if (shader.bindTextures) shader.bindTextures();

    cgl.pushBlend(false);

    mesh.render(inShader.get());

    cgl.popBlend();

    cgl.popPMatrix();
    cgl.popModelMatrix();
    cgl.popViewMatrix();
    fb.renderEnd(cgl);

    if (numTextures >= 2)
    {
        outTex.set(fb.getTextureColorNum(0));
        outTex2.set(fb.getTextureColorNum(1));
        outTex3.set(fb.getTextureColorNum(2));
        outTex4.set(fb.getTextureColorNum(3));
    }
    else outTex.set(fb.getTextureColor());

    cgl.popShader();

    cgl.gl.viewport(prevViewPort[0], prevViewPort[1], prevViewPort[2], prevViewPort[3]);

    next.trigger();
};


};

Ops.Gl.Shader.Shader2Texture.prototype = new CABLES.Op();
CABLES.OPS["a3debb76-7d84-4548-9e7b-24891423dcce"]={f:Ops.Gl.Shader.Shader2Texture,objName:"Ops.Gl.Shader.Shader2Texture"};




// **************************************************************
// 
// Ops.Ui.VizTexture
// 
// **************************************************************

Ops.Ui.VizTexture = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"viztex_frag":"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI samplerCube cubeMap;\nUNI float width;\nUNI float height;\nUNI float type;\nUNI float time;\n\nfloat LinearizeDepth(float d,float zNear,float zFar)\n{\n    float z_n = 2.0 * d - 1.0;\n    return 2.0 * zNear / (zFar + zNear - z_n * (zFar - zNear));\n}\n\nvoid main()\n{\n    vec4 col=vec4(vec3(0.),0.0);\n\n    vec4 colTex=texture(tex,texCoord);\n\n\n\n    if(type==1.0)\n    {\n        vec4 depth=vec4(0.);\n        vec2 localST=texCoord;\n        localST.y = 1. - localST.y;\n\n        localST.t = mod(localST.t*3.,1.);\n        localST.s = mod(localST.s*4.,1.);\n\n        #ifdef WEBGL2\n            #define texCube texture\n        #endif\n        #ifdef WEBGL1\n            #define texCube textureCube\n        #endif\n\n//         //Due to the way my depth-cubeMap is rendered, objects to the -x,y,z side is projected to the positive x,y,z side\n//         //Inside where top/bottom is to be drawn?\n        if (texCoord.s*4.> 1. && texCoord.s*4.<2.)\n        {\n            //Bottom (-y) quad\n            if (texCoord.t*3. < 1.)\n            {\n                vec3 dir=vec3(localST.s*2.-1.,-1.,-localST.t*2.+1.);//Due to the (arbitrary) way I choose as up in my depth-viewmatrix, i her emultiply the latter coordinate with -1\n                depth = texCube(cubeMap, dir);\n            }\n            //top (+y) quad\n            else if (texCoord.t*3. > 2.)\n            {\n                vec3 dir=vec3(localST.s*2.-1.,1.,localST.t*2.-1.);//Get lower y texture, which is projected to the +y part of my cubeMap\n                depth = texCube(cubeMap, dir);\n            }\n            else//Front (-z) quad\n            {\n                vec3 dir=vec3(localST.s*2.-1.,-localST.t*2.+1.,1.);\n                depth = texCube(cubeMap, dir);\n            }\n        }\n//         //If not, only these ranges should be drawn\n        else if (texCoord.t*3. > 1. && texCoord.t*3. < 2.)\n        {\n            if (texCoord.x*4. < 1.)//left (-x) quad\n            {\n                vec3 dir=vec3(-1.,-localST.t*2.+1.,localST.s*2.-1.);\n                depth = texCube(cubeMap, dir);\n            }\n            else if (texCoord.x*4. < 3.)//right (+x) quad (front was done above)\n            {\n                vec3 dir=vec3(1,-localST.t*2.+1.,-localST.s*2.+1.);\n                depth = texCube(cubeMap, dir);\n            }\n            else //back (+z) quad\n            {\n                vec3 dir=vec3(-localST.s*2.+1.,-localST.t*2.+1.,-1.);\n                depth = texCube(cubeMap, dir);\n            }\n        }\n        // colTex = vec4(vec3(depth),1.);\n        colTex = vec4(depth);\n    }\n\n    if(type==2.0)\n    {\n       float near = 0.1;\n       float far = 50.;\n       float depth = LinearizeDepth(colTex.r, near, far);\n       colTex.rgb = vec3(depth);\n    }\n\n\n    #ifdef ANIM_RANGE\n\n        if(colTex.r>1.0 || colTex.r<0.0)\n            colTex.r=mod(colTex.r,1.0)*0.5+(sin(colTex.r+mod(colTex.r*3.0,1.0)+time*5.0)*0.5+0.5)*0.5;\n        if(colTex.g>1.0 || colTex.g<0.0)\n            colTex.g=mod(colTex.g,1.0)*0.5+(sin(colTex.g+mod(colTex.g*3.0,1.0)+time*5.0)*0.5+0.5)*0.5;\n        if(colTex.b>1.0 || colTex.b<0.0)\n            colTex.b=mod(colTex.b,1.0)*0.5+(sin(colTex.b+mod(colTex.b*3.0,1.0)+time*5.0)*0.5+0.5)*0.5;\n\n    #endif\n\n\n    // #ifdef ANIM_RANGE\n    //     if(colTex.r>1.0 || colTex.r<0.0)\n    //     {\n    //         float r=mod( time+colTex.r,1.0)*0.5+0.5;\n    //         colTex.r=r;\n    //     }\n    //     if(colTex.g>1.0 || colTex.g<0.0)\n    //     {\n    //         float r=mod( time+colTex.g,1.0)*0.5+0.5;\n    //         colTex.g=r;\n    //     }\n    //     if(colTex.b>1.0 || colTex.b<0.0)\n    //     {\n    //         float r=mod( time+colTex.b,1.0)*0.5+0.5;\n    //         colTex.b=r;\n    //     }\n    // #endif\n\n    outColor = mix(col,colTex,colTex.a);\n}\n\n","viztex_vert":"IN vec3 vPosition;\nIN vec2 attrTexCoord;\nOUT vec2 texCoord;\nUNI mat4 projMatrix;\nUNI mat4 modelMatrix;\nUNI mat4 viewMatrix;\n\nvoid main()\n{\n    texCoord=vec2(attrTexCoord.x,1.0-attrTexCoord.y);\n    vec4 pos = vec4( vPosition, 1. );\n    mat4 mvMatrix=viewMatrix * modelMatrix;\n    gl_Position = projMatrix * mvMatrix * pos;\n}",};
const
    inTex = op.inTexture("Texture In"),
    inShowInfo = op.inBool("Show Info", false),
    inVizRange = op.inSwitch("Visualize outside 0-1", ["Off", "Anim"], "Anim"),

    inPickColor = op.inBool("Show Color", false),
    inX = op.inFloatSlider("X", 0.5),
    inY = op.inFloatSlider("Y", 0.5),

    outTex = op.outTexture("Texture Out"),
    outInfo = op.outString("Info");

op.setUiAttrib({ "height": 150, "resizable": true });

const timer = new CABLES.Timer();
timer.play();

let shader = null;
let fb = null;
let pixelReader = null;
let colorString = "";

inVizRange.onChange = updateDefines;

inPickColor.onChange = updateUi;
updateUi();

function updateUi()
{
    inX.setUiAttribs({ "greyout": !inPickColor.get() });
    inY.setUiAttribs({ "greyout": !inPickColor.get() });
}

inTex.onChange = () =>
{
    const t = inTex.get();

    outTex.setRef(t);

    let title = "";

    if (inTex.get()) title = inTex.links[0].getOtherPort(inTex).name;

    op.setUiAttrib({ "extendTitle": title });
};

function updateDefines()
{
    if (!shader) return;
    shader.toggleDefine("ANIM_RANGE", inVizRange.get() == "Anim");
}

op.renderVizLayer = (ctx, layer) =>
{
    const port = inTex;
    const texSlot = 5;
    const texSlotCubemap = texSlot + 1;

    const perf = CABLES.UI.uiProfiler.start("previewlayer texture");
    const cgl = port.parent.patch.cgl;

    if (!layer.useGl) return;

    if (!this._emptyCubemap) this._emptyCubemap = CGL.Texture.getEmptyCubemapTexture(cgl);
    port.parent.patch.cgl.profileData.profileTexPreviews++;

    const portTex = port.get() || CGL.Texture.getEmptyTexture(cgl);

    if (!this._mesh)
    {
        const geom = new CGL.Geometry("preview op rect");
        geom.vertices = [1.0, 1.0, 0.0, -1.0, 1.0, 0.0, 1.0, -1.0, 0.0, -1.0, -1.0, 0.0];
        geom.texCoords = [
            1.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            0.0, 0.0];
        geom.verticesIndices = [0, 1, 2, 3, 1, 2];
        this._mesh = new CGL.Mesh(cgl, geom);
    }
    if (!this._shader)
    {
        this._shader = new CGL.Shader(cgl, "glpreviewtex");
        this._shader.setModules(["MODULE_VERTEX_POSITION", "MODULE_COLOR", "MODULE_BEGIN_FRAG"]);
        this._shader.setSource(attachments.viztex_vert, attachments.viztex_frag);
        this._shaderTexUniform = new CGL.Uniform(this._shader, "t", "tex", texSlot);
        this._shaderTexCubemapUniform = new CGL.Uniform(this._shader, "tc", "cubeMap", texSlotCubemap);
        shader = this._shader;
        updateDefines();

        this._shaderTexUniformW = new CGL.Uniform(this._shader, "f", "width", portTex.width);
        this._shaderTexUniformH = new CGL.Uniform(this._shader, "f", "height", portTex.height);
        this._shaderTypeUniform = new CGL.Uniform(this._shader, "f", "type", 0);
        this._shaderTimeUniform = new CGL.Uniform(this._shader, "f", "time", 0);
    }

    cgl.pushPMatrix();
    const sizeTex = [portTex.width, portTex.height];
    const small = port.parent.patch.cgl.canvasWidth > sizeTex[0] && port.parent.patch.cgl.canvasHeight > sizeTex[1];

    if (small)
    {
        mat4.ortho(cgl.pMatrix, 0, port.parent.patch.cgl.canvasWidth, port.parent.patch.cgl.canvasHeight, 0, 0.001, 11);
    }
    else mat4.ortho(cgl.pMatrix, -1, 1, 1, -1, 0.001, 11);

    const oldTex = cgl.getTexture(texSlot);
    const oldTexCubemap = cgl.getTexture(texSlotCubemap);

    let texType = 0;
    if (!portTex) return;
    if (portTex.cubemap) texType = 1;
    if (portTex.textureType == CGL.Texture.TYPE_DEPTH) texType = 2;

    if (texType == 0 || texType == 2)
    {
        cgl.setTexture(texSlot, portTex.tex);
        cgl.setTexture(texSlotCubemap, this._emptyCubemap.cubemap, cgl.gl.TEXTURE_CUBE_MAP);
    }
    else if (texType == 1)
    {
        cgl.setTexture(texSlotCubemap, portTex.cubemap, cgl.gl.TEXTURE_CUBE_MAP);
    }

    timer.update();
    this._shaderTimeUniform.setValue(timer.get());

    this._shaderTypeUniform.setValue(texType);
    let s = [port.parent.patch.cgl.canvasWidth, port.parent.patch.cgl.canvasHeight];

    cgl.gl.clearColor(0, 0, 0, 0);
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

    cgl.pushModelMatrix();
    if (small)
    {
        s = sizeTex;
        mat4.translate(cgl.mMatrix, cgl.mMatrix, [sizeTex[0] / 2, sizeTex[1] / 2, 0]);
        mat4.scale(cgl.mMatrix, cgl.mMatrix, [sizeTex[0] / 2, sizeTex[1] / 2, 0]);
    }
    this._mesh.render(this._shader);
    cgl.popModelMatrix();

    if (texType == 0) cgl.setTexture(texSlot, oldTex);
    if (texType == 1) cgl.setTexture(texSlotCubemap, oldTexCubemap);

    cgl.popPMatrix();
    cgl.resetViewPort();

    const sizeImg = [layer.width, layer.height];

    const stretch = false;
    if (!stretch)
    {
        if (portTex.width > portTex.height) sizeImg[1] = layer.width * sizeTex[1] / sizeTex[0];
        else
        {
            sizeImg[1] = layer.width * (sizeTex[1] / sizeTex[0]);

            if (sizeImg[1] > layer.height)
            {
                const r = layer.height / sizeImg[1];
                sizeImg[0] *= r;
                sizeImg[1] *= r;
            }
        }
    }

    const scaledDown = sizeImg[0] > sizeTex[0] && sizeImg[1] > sizeTex[1];

    ctx.imageSmoothingEnabled = !small || !scaledDown;

    if (!ctx.imageSmoothingEnabled)
    {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(layer.x, layer.y - 10, 10, 10);
        ctx.fillStyle = "#000000";
        ctx.fillRect(layer.x, layer.y - 10, 5, 5);
        ctx.fillRect(layer.x + 5, layer.y - 10 + 5, 5, 5);
    }

    let numX = (10 * layer.width / layer.height);
    let stepY = (layer.height / 10);
    let stepX = (layer.width / numX);
    for (let x = 0; x < numX; x++)
        for (let y = 0; y < 10; y++)
        {
            if ((x + y) % 2 == 0)ctx.fillStyle = "#333333";
            else ctx.fillStyle = "#393939";
            ctx.fillRect(layer.x + stepX * x, layer.y + stepY * y, stepX, stepY);
        }

    ctx.fillStyle = "#222";
    const borderLeft = (layer.width - sizeImg[0]) / 2;
    const borderTop = (layer.height - sizeImg[1]) / 2;
    ctx.fillRect(
        layer.x, layer.y,
        borderLeft, (layer.height)
    );
    ctx.fillRect(
        layer.x + sizeImg[0] + borderLeft, layer.y,
        borderLeft, (layer.height)
    );
    ctx.fillRect(
        layer.x, layer.y,
        layer.width, borderTop
    );
    ctx.fillRect(
        layer.x, layer.y + sizeImg[1] + borderTop,
        layer.width, borderTop
    );

    if (sizeTex[1] == 1)
        ctx.drawImage(cgl.canvas,
            0, 0,
            s[0], s[1],
            layer.x, layer.y,
            layer.width, layer.height * 5);// workaround filtering problems
    if (sizeTex[0] == 1)
        ctx.drawImage(cgl.canvas,
            0, 0,
            s[0], s[1],
            layer.x, layer.y,
            layer.width * 5, layer.height); // workaround filtering problems
    else
        ctx.drawImage(cgl.canvas,
            0, 0,
            s[0], s[1],
            layer.x + (layer.width - sizeImg[0]) / 2, layer.y + (layer.height - sizeImg[1]) / 2,
            sizeImg[0], sizeImg[1]);

    let info = "unknown";

    if (port.get() && port.get().getInfoOneLine) info = port.get().getInfoOneLine();

    if (inShowInfo.get())
    {
        ctx.save();
        ctx.scale(layer.scale, layer.scale);
        ctx.font = "normal 10px sourceCodePro";
        ctx.fillStyle = "#000";
        ctx.fillText(info, layer.x / layer.scale + 5 + 0.5, (layer.y + layer.height) / layer.scale - 5 + 0.5);
        ctx.fillStyle = "#fff";
        ctx.fillText(info, layer.x / layer.scale + 5, (layer.y + layer.height) / layer.scale - 5);
        ctx.restore();
    }

    if (inPickColor.get())
    {
        ctx.save();
        ctx.scale(layer.scale, layer.scale);
        ctx.font = "normal 10px sourceCodePro";
        ctx.fillStyle = "#000";
        ctx.fillText("RGBA " + colorString, layer.x / layer.scale + 10 + 0.5, layer.y / layer.scale + 10 + 0.5);
        ctx.fillStyle = "#fff";
        ctx.fillText("RGBA " + colorString, layer.x / layer.scale + 10, layer.y / layer.scale + 10);

        ctx.restore();

        ctx.fillStyle = "#000";
        ctx.fillRect(
            layer.x + layer.width * inX.get() - 1,
            layer.y + sizeImg[1] * inY.get() - 10 + borderTop,
            3, 20);

        ctx.fillRect(
            layer.x + layer.width * inX.get() - 10,
            layer.y + sizeImg[1] * inY.get() - 1 + borderTop,
            20, 3);

        ctx.fillStyle = "#fff";
        ctx.fillRect(
            layer.x + layer.width * inX.get() - 1,
            layer.y + sizeImg[1] * inY.get() - 10 + borderTop,
            1, 20);

        ctx.fillRect(
            layer.x + layer.width * inX.get() - 10,
            layer.y + sizeImg[1] * inY.get() - 1 + borderTop,
            20, 1);
    }

    outInfo.set(info);

    if (inPickColor.get())
    {
        const gl = cgl.gl;

        const realTexture = inTex.get();
        if (!realTexture)
        {
            colorString = "";
            return;
        }
        if (!fb) fb = gl.createFramebuffer();
        if (!pixelReader) pixelReader = new CGL.PixelReader();

        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D, realTexture.tex, 0
        );

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        pixelReader.read(cgl, fb, realTexture.textureType, inX.get() * realTexture.width, realTexture.height - inY.get() * realTexture.height, 1, 1,
            (pixel) =>
            {
                if (realTexture.textureType != CGL.Texture.TYPE_FLOAT)colorString = Math.floor(pixel[0] / 255 * 100) / 100 + "," + Math.floor(pixel[1] / 255 * 100) / 100 + "," + Math.floor(pixel[2] / 255 * 100) / 100 + "," + Math.floor(pixel[3] / 255 * 100) / 100;
                else colorString = Math.round(pixel[0] * 100) / 100 + "," + Math.round(pixel[1] * 100) / 100 + "," + Math.round(pixel[2] * 100) / 100 + "," + Math.round(pixel[3] * 100) / 100;
            });
    }

    cgl.gl.clearColor(0, 0, 0, 0);
    cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);

    perf.finish();
};


};

Ops.Ui.VizTexture.prototype = new CABLES.Op();
CABLES.OPS["4ea2d7b0-ca74-45db-962b-4d1965ac20c0"]={f:Ops.Ui.VizTexture,objName:"Ops.Ui.VizTexture"};




// **************************************************************
// 
// Ops.Gl.Performance
// 
// **************************************************************

Ops.Gl.Performance = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe = op.inTrigger("exe"),
    inShow = op.inValueBool("Visible", true),
    next = op.outTrigger("childs"),
    position = op.inSwitch("Position", ["top", "bottom"], "top"),
    openDefault = op.inBool("Open", false),
    smoothGraph = op.inBool("Smooth Graph", true),
    inScaleGraph = op.inFloat("Scale", 4),
    inSizeGraph = op.inFloat("Size", 128),
    outCanv = op.outObject("Canvas"),
    outFPS = op.outNumber("FPS");

const cgl = op.patch.cgl;
const element = document.createElement("div");

let elementMeasures = null;
let ctx = null;
let opened = false;
let frameCount = 0;
let fps = 0;
let fpsStartTime = 0;
let childsTime = 0;
let avgMsChilds = 0;
const queue = [];
const timesMainloop = [];
const timesOnFrame = [];
const timesGPU = [];
let avgMs = 0;
let selfTime = 0;
let canvas = null;
let lastTime = 0;
let loadingCounter = 0;
const loadingChars = ["|", "/", "-", "\\"];
let initMeasures = true;

const colorRAFSlow = "#ffffff";
const colorBg = "#222222";
const colorRAF = "#003f5c"; // color: https://learnui.design/tools/data-color-picker.html
const colorMainloop = "#7a5195";
const colorOnFrame = "#ef5675";
const colorGPU = "#ffa600";

let startedQuery = false;

let currentTimeGPU = 0;
let currentTimeMainloop = 0;
let currentTimeOnFrame = 0;

op.toWorkPortsNeedToBeLinked(exe, next);

const gl = op.patch.cgl.gl;
const glQueryExt = gl.getExtension("EXT_disjoint_timer_query_webgl2");

exe.onLinkChanged =
    inShow.onChange = () =>
    {
        updateOpened();
        updateVisibility();
    };

position.onChange = updatePos;
inSizeGraph.onChange = updateSize;

element.id = "performance";
element.style.position = "absolute";
element.style.left = "0px";
element.style.opacity = "0.8";
element.style.padding = "10px";
element.style.cursor = "pointer";
element.style.background = "#222";
element.style.color = "white";
element.style["font-family"] = "monospace";
element.style["font-size"] = "12px";
element.style["z-index"] = "99999";

element.innerHTML = "&nbsp;";
element.addEventListener("click", toggleOpened);

const container = op.patch.cgl.canvas.parentElement;
container.appendChild(element);

updateSize();
updateOpened();
updatePos();
updateVisibility();

op.onDelete = function ()
{
    if (canvas)canvas.remove();
    if (element)element.remove();
};

function updatePos()
{
    canvas.style["pointer-events"] = "none";
    if (position.get() == "top")
    {
        canvas.style.top = element.style.top = "0px";
        canvas.style.bottom = element.style.bottom = "initial";
    }
    else
    {
        canvas.style.bottom = element.style.bottom = "0px";
        canvas.style.top = element.style.top = "initial";
    }
}

function updateVisibility()
{
    if (!inShow.get() || !exe.isLinked())
    {
        element.style.display = "none";
        element.style.opacity = 0;
        canvas.style.display = "none";
    }
    else
    {
        element.style.display = "block";
        element.style.opacity = 1;
        canvas.style.display = "block";
    }
}

function updateSize()
{
    if (!canvas) return;

    const num = Math.max(0, parseInt(inSizeGraph.get()));

    canvas.width = num;
    canvas.height = num;
    element.style.left = num + "px";

    queue.length = 0;
    timesMainloop.length = 0;
    timesOnFrame.length = 0;
    timesGPU.length = 0;

    for (let i = 0; i < num; i++)
    {
        queue[i] = -1;
        timesMainloop[i] = -1;
        timesOnFrame[i] = -1;
        timesGPU[i] = -1;
    }
}

openDefault.onChange = function ()
{
    opened = openDefault.get();
    updateOpened();
};

function toggleOpened()
{
    if (!inShow.get()) return;
    element.style.opacity = 1;
    opened = !opened;
    updateOpened();
}

function updateOpened()
{
    updateText();
    if (!canvas)createCanvas();
    if (opened)
    {
        canvas.style.display = "block";
        element.style.left = inSizeGraph.get() + "px";
        element.style["min-height"] = "56px";
    }
    else
    {
        canvas.style.display = "none";
        element.style.left = "0px";
        element.style["min-height"] = "auto";
    }
}

function updateCanvas()
{
    const height = canvas.height;
    const hmul = inScaleGraph.get();

    ctx.fillStyle = colorBg;
    ctx.fillRect(0, 0, canvas.width, height);
    ctx.fillStyle = colorRAF;

    let k = 0;
    const numBars = Math.max(0, parseInt(inSizeGraph.get()));

    for (k = numBars; k >= 0; k--)
    {
        if (queue[k] > 30)ctx.fillStyle = colorRAFSlow;
        ctx.fillRect(numBars - k, height - queue[k] * hmul, 1, queue[k] * hmul);
        if (queue[k] > 30)ctx.fillStyle = colorRAF;
    }

    for (k = numBars; k >= 0; k--)
    {
        let sum = 0;
        ctx.fillStyle = colorMainloop;
        sum = timesMainloop[k];
        ctx.fillRect(numBars - k, height - sum * hmul, 1, timesMainloop[k] * hmul);

        ctx.fillStyle = colorOnFrame;
        sum += timesOnFrame[k];
        ctx.fillRect(numBars - k, height - sum * hmul, 1, timesOnFrame[k] * hmul);

        ctx.fillStyle = colorGPU;
        sum += timesGPU[k];
        ctx.fillRect(numBars - k, height - sum * hmul, 1, timesGPU[k] * hmul);
    }
}

function createCanvas()
{
    canvas = document.createElement("canvas");
    canvas.id = "performance_" + op.patch.config.glCanvasId;
    canvas.width = inSizeGraph.get();
    canvas.height = inSizeGraph.get();
    canvas.style.display = "block";
    canvas.style.opacity = 0.9;
    canvas.style.position = "absolute";
    canvas.style.left = "0px";
    canvas.style.cursor = "pointer";
    canvas.style.top = "-64px";
    canvas.style["z-index"] = "99998";
    container.appendChild(canvas);
    ctx = canvas.getContext("2d");

    canvas.addEventListener("click", toggleOpened);

    updateSize();
}

function updateText()
{
    if (!inShow.get()) return;
    let warn = "";

    if (op.patch.cgl.profileData.profileShaderCompiles > 0)warn += "Shader compile (" + op.patch.cgl.profileData.profileShaderCompileName + ") ";
    if (op.patch.cgl.profileData.profileShaderGetUniform > 0)warn += "Shader get uni loc! (" + op.patch.cgl.profileData.profileShaderGetUniformName + ")";
    if (op.patch.cgl.profileData.profileTextureResize > 0)warn += "Texture resize! ";
    if (op.patch.cgl.profileData.profileFrameBuffercreate > 0)warn += "Framebuffer create! ";
    if (op.patch.cgl.profileData.profileEffectBuffercreate > 0)warn += "Effectbuffer create! ";
    if (op.patch.cgl.profileData.profileTextureDelete > 0)warn += "Texture delete! ";
    if (op.patch.cgl.profileData.profileNonTypedAttrib > 0)warn += "Not-Typed Buffer Attrib! " + op.patch.cgl.profileData.profileNonTypedAttribNames;
    if (op.patch.cgl.profileData.profileTextureNew > 0)warn += "new texture created! ";
    if (op.patch.cgl.profileData.profileGenMipMap > 0)warn += "generating mip maps!";

    if (warn.length > 0)
    {
        warn = "| <span style=\"color:#f80;\">WARNING: " + warn + "<span>";
    }

    let html = "";

    if (opened)
    {
        html += "<span style=\"color:" + colorRAF + "\">■</span> " + fps + " fps ";
        html += "<span style=\"color:" + colorMainloop + "\">■</span> " + Math.round(currentTimeMainloop * 100) / 100 + "ms mainloop ";
        html += "<span style=\"color:" + colorOnFrame + "\">■</span> " + Math.round((currentTimeOnFrame) * 100) / 100 + "ms onframe ";
        if (currentTimeGPU) html += "<span style=\"color:" + colorGPU + "\">■</span> " + Math.round(currentTimeGPU * 100) / 100 + "ms GPU";
        html += warn;
        element.innerHTML = html;
    }
    else
    {
        html += fps + " fps / ";
        html += "CPU: " + Math.round((op.patch.cgl.profileData.profileOnAnimFrameOps) * 100) / 100 + "ms / ";
        if (currentTimeGPU)html += "GPU: " + Math.round(currentTimeGPU * 100) / 100 + "ms  ";
        element.innerHTML = html;
    }

    if (op.patch.loading.getProgress() != 1.0)
    {
        element.innerHTML += "<br/>loading " + Math.round(op.patch.loading.getProgress() * 100) + "% " + loadingChars[(++loadingCounter) % loadingChars.length];
    }

    if (opened)
    {
        let count = 0;
        avgMs = 0;
        avgMsChilds = 0;
        for (let i = queue.length; i > queue.length - queue.length / 3; i--)
        {
            if (queue[i] > -1)
            {
                avgMs += queue[i];
                count++;
            }

            if (timesMainloop[i] > -1) avgMsChilds += timesMainloop[i];
        }

        avgMs /= count;
        avgMsChilds /= count;

        element.innerHTML += "<br/> " + cgl.canvasWidth + " x " + cgl.canvasHeight + " (x" + cgl.pixelDensity + ") ";
        element.innerHTML += "<br/>frame avg: " + Math.round(avgMsChilds * 100) / 100 + " ms (" + Math.round(avgMsChilds / avgMs * 100) + "%) / " + Math.round(avgMs * 100) / 100 + " ms";
        element.innerHTML += " (self: " + Math.round((selfTime) * 100) / 100 + " ms) ";

        element.innerHTML += "<br/>shader binds: " + Math.ceil(op.patch.cgl.profileData.profileShaderBinds / fps) +
            " uniforms: " + Math.ceil(op.patch.cgl.profileData.profileUniformCount / fps) +
            " mvp_uni_mat4: " + Math.ceil(op.patch.cgl.profileData.profileMVPMatrixCount / fps) +
            " num glPrimitives: " + Math.ceil(op.patch.cgl.profileData.profileMeshNumElements / (fps)) +

            " fenced pixelread: " + Math.ceil(op.patch.cgl.profileData.profileFencedPixelRead) +

            " mesh.setGeom: " + op.patch.cgl.profileData.profileMeshSetGeom +
            " videos: " + op.patch.cgl.profileData.profileVideosPlaying +
            " tex preview: " + op.patch.cgl.profileData.profileTexPreviews;

        element.innerHTML +=
        " draw meshes: " + Math.ceil(op.patch.cgl.profileData.profileMeshDraw / fps) +
        " framebuffer blit: " + Math.ceil(op.patch.cgl.profileData.profileFramebuffer / fps) +
        " texeffect blit: " + Math.ceil(op.patch.cgl.profileData.profileTextureEffect / fps);

        element.innerHTML += " all shader compiletime: " + Math.round(op.patch.cgl.profileData.shaderCompileTime * 100) / 100;
    }

    op.patch.cgl.profileData.clear();
}

function styleMeasureEle(ele)
{
    ele.style.padding = "0px";
    ele.style.margin = "0px";
}

function addMeasureChild(m, parentEle, timeSum, level)
{
    const height = 20;
    m.usedAvg = (m.usedAvg || m.used);

    if (!m.ele || initMeasures)
    {
        const newEle = document.createElement("div");
        m.ele = newEle;

        if (m.childs && m.childs.length > 0) newEle.style.height = "500px";
        else newEle.style.height = height + "px";

        newEle.style.overflow = "hidden";
        newEle.style.display = "inline-block";

        if (!m.isRoot)
        {
            newEle.innerHTML = "<div style=\"min-height:" + height + "px;width:100%;overflow:hidden;color:black;position:relative\">&nbsp;" + m.name + "</div>";
            newEle.style["background-color"] = "rgb(" + m.colR + "," + m.colG + "," + m.colB + ")";
            newEle.style["border-left"] = "1px solid black";
        }

        parentEle.appendChild(newEle);
    }

    if (!m.isRoot)
    {
        if (performance.now() - m.lastTime > 200)
        {
            m.ele.style.display = "none";
            m.hidden = true;
        }
        else
        {
            if (m.hidden)
            {
                m.ele.style.display = "inline-block";
                m.hidden = false;
            }
        }

        m.ele.style.float = "left";
        m.ele.style.width = Math.floor((m.usedAvg / timeSum) * 98.0) + "%";
    }
    else
    {
        m.ele.style.width = "100%";
        m.ele.style.clear = "both";
        m.ele.style.float = "none";
    }

    if (m && m.childs && m.childs.length > 0)
    {
        let thisTimeSum = 0;
        for (var i = 0; i < m.childs.length; i++)
        {
            m.childs[i].usedAvg = (m.childs[i].usedAvg || m.childs[i].used) * 0.95 + m.childs[i].used * 0.05;
            thisTimeSum += m.childs[i].usedAvg;
        }
        for (var i = 0; i < m.childs.length; i++)
        {
            addMeasureChild(m.childs[i], m.ele, thisTimeSum, level + 1);
        }
    }
}

function clearMeasures(p)
{
    for (let i = 0; i < p.childs.length; i++) clearMeasures(p.childs[i]);
    p.childs.length = 0;
}

function measures()
{
    if (!CGL.performanceMeasures) return;

    if (!elementMeasures)
    {
        op.log("create measure ele");
        elementMeasures = document.createElement("div");
        elementMeasures.style.width = "100%";
        elementMeasures.style["background-color"] = "#444";
        elementMeasures.style.bottom = "10px";
        elementMeasures.style.height = "100px";
        elementMeasures.style.opacity = "1";
        elementMeasures.style.position = "absolute";
        elementMeasures.style["z-index"] = "99999";
        elementMeasures.innerHTML = "";
        container.appendChild(elementMeasures);
    }

    let timeSum = 0;
    const root = CGL.performanceMeasures[0];

    for (let i = 0; i < root.childs.length; i++) timeSum += root.childs[i].used;

    addMeasureChild(CGL.performanceMeasures[0], elementMeasures, timeSum, 0);

    root.childs.length = 0;

    clearMeasures(CGL.performanceMeasures[0]);

    CGL.performanceMeasures.length = 0;
    initMeasures = false;
}

exe.onTriggered = render;

function render()
{
    const selfTimeStart = performance.now();
    frameCount++;

    if (glQueryExt && inShow.get())op.patch.cgl.profileData.doProfileGlQuery = true;

    if (fpsStartTime === 0)fpsStartTime = Date.now();
    if (Date.now() - fpsStartTime >= 1000)
    {
        // query=null;
        fps = frameCount;
        frameCount = 0;
        // frames = 0;
        outFPS.set(fps);
        if (inShow.get())updateText();

        fpsStartTime = Date.now();
    }

    const glQueryData = op.patch.cgl.profileData.glQueryData;
    currentTimeGPU = 0;
    if (glQueryData)
    {
        let count = 0;
        for (let i in glQueryData)
        {
            count++;
            if (glQueryData[i].time)
                currentTimeGPU += glQueryData[i].time;
        }
    }

    if (inShow.get())
    {
        measures();

        if (opened && !op.patch.cgl.profileData.pause)
        {
            const timeUsed = performance.now() - lastTime;
            queue.push(timeUsed);
            queue.shift();

            timesMainloop.push(childsTime);
            timesMainloop.shift();

            timesOnFrame.push(op.patch.cgl.profileData.profileOnAnimFrameOps - op.patch.cgl.profileData.profileMainloopMs);
            timesOnFrame.shift();

            timesGPU.push(currentTimeGPU);
            timesGPU.shift();

            updateCanvas();
        }
    }

    lastTime = performance.now();
    selfTime = performance.now() - selfTimeStart;
    const startTimeChilds = performance.now();

    outCanv.set(null);
    outCanv.set(canvas);

    // startGlQuery();
    next.trigger();
    // endGlQuery();

    const nChildsTime = performance.now() - startTimeChilds;
    const nCurrentTimeMainloop = op.patch.cgl.profileData.profileMainloopMs;
    const nCurrentTimeOnFrame = op.patch.cgl.profileData.profileOnAnimFrameOps - op.patch.cgl.profileData.profileMainloopMs;

    if (smoothGraph.get())
    {
        childsTime = childsTime * 0.9 + nChildsTime * 0.1;
        currentTimeMainloop = currentTimeMainloop * 0.5 + nCurrentTimeMainloop * 0.5;
        currentTimeOnFrame = currentTimeOnFrame * 0.5 + nCurrentTimeOnFrame * 0.5;
    }
    else
    {
        childsTime = nChildsTime;
        currentTimeMainloop = nCurrentTimeMainloop;
        currentTimeOnFrame = nCurrentTimeOnFrame;
    }

    op.patch.cgl.profileData.clearGlQuery();
}


};

Ops.Gl.Performance.prototype = new CABLES.Op();
CABLES.OPS["9cd2d9de-000f-4a14-bd13-e7d5f057583c"]={f:Ops.Gl.Performance,objName:"Ops.Gl.Performance"};




// **************************************************************
// 
// Ops.Anim.LFO
// 
// **************************************************************

Ops.Anim.LFO = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    time = op.inValue("Time"),
    type = op.inValueSelect("Type", ["sine", "triangle", "ramp up", "ramp down", "block"], "sine"),
    phase = op.inValue("Phase", 0),
    amplitude = op.inValue("Amplitude", 1),
    result = op.outNumber("Result");

let v = 0;
type.onChange = updateType;

updateType();

const PI2 = Math.PI / 2;

function updateType()
{
    if (type.get() == "sine") time.onChange = sine;
    if (type.get() == "ramp up") time.onChange = rampUp;
    if (type.get() == "ramp down") time.onChange = rampDown;
    if (type.get() == "block") time.onChange = block;
    if (type.get() == "triangle") time.onChange = triangle;
}

function updateTime()
{
    return time.get() + phase.get();
}

function block()
{
    let t = updateTime() + 0.5;
    v = t % 2.0;
    if (v <= 1.0)v = -1;
    else v = 1;
    v *= amplitude.get();
    result.set(v);
}

function rampUp()
{
    let t = (updateTime() + 1);
    t *= 0.5;
    v = t % 1.0;
    v -= 0.5;
    v *= 2.0;
    v *= amplitude.get();
    result.set(v);
}

function rampDown()
{
    let t = updateTime();
    v = t % 1.0;
    v -= 0.5;
    v *= -2.0;
    v *= amplitude.get();
    result.set(v);
}

function triangle()
{
    let t = updateTime();
    v = t % 2.0;
    if (v > 1) v = 2.0 - v;
    v -= 0.5;
    v *= 2.0;
    v *= amplitude.get();
    result.set(v);
}

function sine()
{
    let t = updateTime() * Math.PI - (PI2);
    v = Math.sin((t));
    v *= amplitude.get();
    result.set(v);
}


};

Ops.Anim.LFO.prototype = new CABLES.Op();
CABLES.OPS["559bb980-78fb-47a7-a199-16f10808b150"]={f:Ops.Anim.LFO,objName:"Ops.Anim.LFO"};




// **************************************************************
// 
// Ops.Html.WindowHasFocus
// 
// **************************************************************

Ops.Html.WindowHasFocus = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    outFocussed = op.outBool("has focus"),
    outVisible = op.outBool("Tab Visible", true);

const focused = true;

outFocussed.set(document.hasFocus());

window.addEventListener("blur", handleBlur);
window.addEventListener("focus", handleFocus);

document.addEventListener("visibilitychange", updateVisibility);

op.onDelete = function ()
{
    document.removeEventListener("visibilitychange", updateVisibility);
};

function handleFocus()
{
    outFocussed.set(true);
}

function handleBlur()
{
    outFocussed.set(false);
}

function updateVisibility(e)
{
    outVisible.set(!document.hidden);
}


};

Ops.Html.WindowHasFocus.prototype = new CABLES.Op();
CABLES.OPS["6542896e-aa13-4b57-81e0-163597f4149a"]={f:Ops.Html.WindowHasFocus,objName:"Ops.Html.WindowHasFocus"};




// **************************************************************
// 
// Ops.Ui.Area
// 
// **************************************************************

Ops.Ui.Area = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const inTitle = op.inString("Title", "");

inTitle.setUiAttribs({ "hidePort": true });

op.setUiAttrib({ "hasArea": true });

// exe.onTriggered=function()
// {
//     op.patch.instancing.pushLoop(inNum.get());

//     for(let i=0;i<inNum.get();i++)
//     {
//         idx.set(i);
//         trigger.trigger();
//         op.patch.instancing.increment();
//     }

//     op.patch.instancing.popLoop();
// };

op.init =
    inTitle.onChange =
    op.onLoaded = update;

update();

function update()
{
    if (CABLES.UI)
    {
        gui.setStateUnsaved({ "op": op });
        op.uiAttr(
            {
                "comment_title": inTitle.get() || " "
            });

        op.name = inTitle.get();
    }
}


};

Ops.Ui.Area.prototype = new CABLES.Op();
CABLES.OPS["38f79614-b0de-4960-8da5-2827e7f43415"]={f:Ops.Ui.Area,objName:"Ops.Ui.Area"};




// **************************************************************
// 
// Ops.Html.WindowInfo
// 
// **************************************************************

Ops.Html.WindowInfo = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    outWidth = op.outNumber("clientWidth"),
    outHeight = op.outNumber("clientHeight"),
    outHeightBody = op.outNumber("body scroll Height"),
    outdevicePixelRatio = op.outNumber("Device Pixel Ratio", 1),
    outIframeChild = op.outBoolNum("Iframe Parent", window.top != window.self);

window.addEventListener("resize", update);

update();

function update()
{
    outWidth.set(window.innerWidth);
    outHeight.set(window.innerHeight);

    outdevicePixelRatio.set(window.devicePixelRatio);

    outHeightBody.set(document.documentElement.scrollHeight);
}


};

Ops.Html.WindowInfo.prototype = new CABLES.Op();
CABLES.OPS["9655045c-3539-457d-be65-a1456a58906a"]={f:Ops.Html.WindowInfo,objName:"Ops.Html.WindowInfo"};




// **************************************************************
// 
// Ops.Math.Compare.GreaterThan
// 
// **************************************************************

Ops.Math.Compare.GreaterThan = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    number1 = op.inValueFloat("number1"),
    number2 = op.inValueFloat("number2"),
    result = op.outBoolNum("result");

op.setTitle(">");

number1.onChange = number2.onChange = exec;

function exec()
{
    result.set(number1.get() > number2.get());
}


};

Ops.Math.Compare.GreaterThan.prototype = new CABLES.Op();
CABLES.OPS["b250d606-f7f8-44d3-b099-c29efff2608a"]={f:Ops.Math.Compare.GreaterThan,objName:"Ops.Math.Compare.GreaterThan"};




// **************************************************************
// 
// Ops.Math.Min_v3
// 
// **************************************************************

Ops.Math.Min_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    val1 = op.inValue("Value 1", 1),
    val2 = op.inValue("Value 2", 2),
    result = op.outNumber("result");

val1.onChange =
    val2.onChange = exec;

exec();

function exec()
{
    let v = Math.min(val1.get(), val2.get());
    result.set(v);
}


};

Ops.Math.Min_v3.prototype = new CABLES.Op();
CABLES.OPS["24a9062d-380c-4690-8fe7-6703787fa94c"]={f:Ops.Math.Min_v3,objName:"Ops.Math.Min_v3"};




// **************************************************************
// 
// Ops.Math.Max
// 
// **************************************************************

Ops.Math.Max = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    value = op.inValueFloat("value", 1),
    max = op.inValueFloat("Maximum", 1),
    result = op.outNumber("result");

max.onChange =
    value.onChange = exec;

exec();

function exec()
{
    let v = Math.max(value.get(), max.get());
    if (v == v) result.set(v);
}


};

Ops.Math.Max.prototype = new CABLES.Op();
CABLES.OPS["07f0be49-c226-4029-8039-3b620145dc2a"]={f:Ops.Math.Max,objName:"Ops.Math.Max"};




// **************************************************************
// 
// Ops.Ui.PatchInput
// 
// **************************************************************

Ops.Ui.PatchInput = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const dyn = op.addOutPort(new CABLES.Port(op, "create port", CABLES.OP_PORT_TYPE_DYNAMIC));

function getPatchOp()
{
    for (let i in op.patch.ops)
    {
        if (op.patch.ops[i].patchId)
        {
            if (op.patch.ops[i].patchId.get() == op.uiAttribs.subPatch)
            {
                return op.patch.ops[i];
            }
        }
    }
}

dyn.onLinkChanged = () =>
{
    const mySubPatchOp = getPatchOp();

    if (!dyn.links.length || !mySubPatchOp || !mySubPatchOp.addNewInPort) return;


    const otherPort = dyn.links[0].getOtherPort(dyn);
    dyn.removeLinks();

    const newPortName = mySubPatchOp.addNewInPort(otherPort);

    const l = gui.scene().link(
        otherPort.parent,
        otherPort.getName(),
        op,
        newPortName);

    mySubPatchOp.saveData();
};


};

Ops.Ui.PatchInput.prototype = new CABLES.Op();
CABLES.OPS["e3f68bc3-892a-4c78-9974-aca25c27025d"]={f:Ops.Ui.PatchInput,objName:"Ops.Ui.PatchInput"};




// **************************************************************
// 
// Ops.Ui.PatchOutput
// 
// **************************************************************

Ops.Ui.PatchOutput = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const dyn = op.addInPort(new CABLES.Port(op, "create port", CABLES.OP_PORT_TYPE_DYNAMIC));

function getPatchOp()
{
    for (let i in op.patch.ops)
    {
        if (op.patch.ops[i].patchId)
        {
            if (op.patch.ops[i].patchId.get() == op.uiAttribs.subPatch)
            {
                return op.patch.ops[i];
            }
        }
    }
}

dyn.onLinkChanged = () =>
{
    const mySubPatchOp = getPatchOp();

    if (!dyn.links.length) return;

    const otherPort = dyn.links[0].getOtherPort(dyn);
    dyn.removeLinks();

    const newPortName = mySubPatchOp.addNewOutPort(otherPort);

    const l = gui.scene().link(
        otherPort.parent,
        otherPort.getName(),
        op,
        newPortName);

    mySubPatchOp.saveData();
};


};

Ops.Ui.PatchOutput.prototype = new CABLES.Op();
CABLES.OPS["851b44cb-5667-4140-9800-5aeb7031f1d7"]={f:Ops.Ui.PatchOutput,objName:"Ops.Ui.PatchOutput"};




// **************************************************************
// 
// Ops.Ui.SubPatch
// 
// **************************************************************

Ops.Ui.SubPatch = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
op.dyn = op.addInPort(new CABLES.Port(op, "create port", CABLES.OP_PORT_TYPE_DYNAMIC));
op.dynOut = op.addOutPort(new CABLES.Port(op, "create port out", CABLES.OP_PORT_TYPE_DYNAMIC));

const dataStr = op.addInPort(new CABLES.Port(op, "dataStr", CABLES.OP_PORT_TYPE_VALUE, { "display": "readonly" }));
op.patchId = op.addInPort(new CABLES.Port(op, "patchId", CABLES.OP_PORT_TYPE_VALUE, { "display": "readonly" }));

if (CABLES.UI && CABLES.sandbox.isDevEnv())
{
    const inMakeBp = op.inTriggerButton("Create Blueprint");
    inMakeBp.setUiAttribs({ "hidePort": true });

    inMakeBp.onTriggered = makeBlueprint;
}

dataStr.setUiAttribs({ "hideParam": true });
op.patchId.setUiAttribs({ "hideParam": true });

let data = { "ports": [], "portsOut": [] };
let oldPatchId = CABLES.generateUUID();
op.patchId.set(oldPatchId);
getSubPatchInputOp();
getSubPatchOutputOp();

let dataLoaded = false;

op.saveData = saveData;

op.init = () =>
{
    op.setStorage({ "subPatchVer": 1 });
};

op.patchId.onChange = function ()
{
    const oldPatchOps = op.patch.getSubPatchOps(oldPatchId);
    if (oldPatchOps.length === 2)
    {
        if (op.patch.isEditorMode() && CABLES.UI.DEFAULTOPS.isInBlueprint(op)) CABLES.UI.undo.pause();
        for (let i = 0; i < oldPatchOps.length; i++)
        {
            op.patch.deleteOp(oldPatchOps[i].id);
        }
        if (op.patch.isEditorMode() && CABLES.UI.DEFAULTOPS.isInBlueprint(op)) CABLES.UI.undo.resume();
    }
};

op.onLoaded = function ()
{
};

op.onLoadedValueSet = function ()
{
    data = JSON.parse(dataStr.get());
    if (!data)
    {
        data = { "ports": [], "portsOut": [] };
    }
    setupPorts();
};

function loadData()
{
}

dataStr.onChange = function ()
{
    if (dataLoaded) return;

    if (!dataStr.get()) return;
    try
    {
        loadData();
    }
    catch (e)
    {
        op.logError("cannot load subpatch data...");
        op.logError(e);
    }
};

function saveData()
{
    try
    {
        dataStr.set(JSON.stringify(data));
    }
    catch (e)
    {
        op.log(e);
    }
}

op.addPortListener = addPortListener;
function addPortListener(newPort, newPortInPatch)
{
    if (!newPort.hasSubpatchLstener)
    {
        newPort.hasSubpatchLstener = true;
        newPort.addEventListener("onUiAttrChange", function (attribs)
        {
            if (attribs.title)
            {
                let i = 0;
                for (i = 0; i < data.portsOut.length; i++)
                    if (data.portsOut[i].name == newPort.name)
                        data.portsOut[i].title = attribs.title;

                for (i = 0; i < data.ports.length; i++)
                    if (data.ports[i].name == newPort.name)
                        data.ports[i].title = attribs.title;

                saveData();
            }
        });
    }

    if (newPort.direction == CABLES.PORT_DIR_IN)
    {
        if (newPort.type == CABLES.OP_PORT_TYPE_FUNCTION)
        {
            newPort.onTriggered = function ()
            {
                if (newPortInPatch.isLinked())
                    newPortInPatch.trigger();
            };
        }
        else
        {
            newPort.onChange = function ()
            {
                newPortInPatch.set(newPort.get());
                if (!newPort.isLinked())
                {
                    for (let i = 0; i < data.ports.length; i++)
                    {
                        if (data.ports[i].name === newPort.name)
                        {
                            data.ports[i].value = newPort.get();
                        }
                    }
                    saveData();
                }
            };
        }
    }
}

op.setupPorts = setupPorts;
function setupPorts()
{
    if (!op.patchId.get()) return;
    const ports = data.ports || [];
    const portsOut = data.portsOut || [];
    let i = 0;

    for (i = 0; i < ports.length; i++)
    {
        if (!op.getPortByName(ports[i].name))
        {
            const newPort = op.addInPort(new CABLES.Port(op, ports[i].name, ports[i].type));

            const patchInputOp = getSubPatchInputOp();
            const newPortInPatch = patchInputOp.addOutPort(new CABLES.Port(patchInputOp, ports[i].name, ports[i].type));

            newPort.ignoreValueSerialize = true;
            newPort.setUiAttribs({ "editableTitle": true });
            if (ports[i].title)
            {
                newPort.setUiAttribs({ "title": ports[i].title });
                newPortInPatch.setUiAttribs({ "title": ports[i].title });
            }
            if (ports[i].objType)
            {
                newPort.setUiAttribs({ "objType": ports[i].objType });
                newPortInPatch.setUiAttribs({ "objType": ports[i].objType });
            }
            if (ports[i].value)
            {
                newPort.set(ports[i].value);
                newPortInPatch.set(ports[i].value);
            }
            addPortListener(newPort, newPortInPatch);
        }
    }

    for (i = 0; i < portsOut.length; i++)
    {
        if (!op.getPortByName(portsOut[i].name))
        {
            const newPortOut = op.addOutPort(new CABLES.Port(op, portsOut[i].name, portsOut[i].type));
            const patchOutputOp = getSubPatchOutputOp();
            const newPortOutPatch = patchOutputOp.addInPort(new CABLES.Port(patchOutputOp, portsOut[i].name, portsOut[i].type));

            newPortOut.ignoreValueSerialize = true;
            newPortOut.setUiAttribs({ "editableTitle": true });

            if (portsOut[i].title)
            {
                newPortOut.setUiAttribs({ "title": portsOut[i].title });
                newPortOutPatch.setUiAttribs({ "title": portsOut[i].title });
            }
            if (portsOut[i].objType)
            {
                newPortOut.setUiAttribs({ "objType": portsOut[i].objType });
                newPortOutPatch.setUiAttribs({ "objType": portsOut[i].objType });
            }

            // addPortListener(newPortOut,newPortOutPatch);
            addPortListener(newPortOutPatch, newPortOut);
        }
    }

    dataLoaded = true;
}

op.addNewInPort = function (otherPort, type, objType)
{
    const newName = "in" + data.ports.length + " " + otherPort.parent.name + " " + otherPort.name;

    const o = { "name": newName, "type": otherPort.type };
    if (otherPort.uiAttribs.objType)o.objType = otherPort.uiAttribs.objType;

    data.ports.push(o);
    setupPorts();
    return newName;
};

op.dyn.onLinkChanged = function ()
{
    if (op.dyn.isLinked())
    {
        const otherPort = op.dyn.links[0].getOtherPort(op.dyn);
        op.dyn.removeLinks();
        otherPort.removeLinkTo(op.dyn);

        op.log("dyn link changed!!!");

        // const newName = "in" + data.ports.length + " " + otherPort.parent.name + " " + otherPort.name;

        // const o = { "name": newName, "type": otherPort.type };
        // if (otherPort.uiAttribs.objType)o.objType = otherPort.uiAttribs.objType;
        // data.ports.push(o);

        // setupPorts();

        const newName = op.addNewInPort(otherPort);

        const l = gui.scene().link(
            otherPort.parent,
            otherPort.getName(),
            op,
            newName
        );

        dataLoaded = true;
        saveData();
    }
    else
    {
        setTimeout(function ()
        {
            op.dyn.removeLinks();
        }, 100);
    }
};

op.addNewOutPort = function (otherPort, type, objType)
{
    const newName = "out" + data.portsOut.length + " " + otherPort.parent.name + " " + otherPort.name;

    const o = { "name": newName, "type": otherPort.type };
    if (otherPort.uiAttribs.objType)o.objType = otherPort.uiAttribs.objType;

    data.portsOut.push(o);
    setupPorts();
    return newName;
};

op.dynOut.onLinkChanged = function ()
{
    if (op.dynOut.isLinked())
    {
        const otherPort = op.dynOut.links[0].getOtherPort(op.dynOut);
        op.dynOut.removeLinks();
        otherPort.removeLinkTo(op.dynOut);

        const newName = op.addNewOutPort(otherPort);

        gui.scene().link(
            otherPort.parent,
            otherPort.getName(),
            op,
            newName
        );

        dataLoaded = true;
        saveData();
    }
    else
    {
        setTimeout(function ()
        {
            op.dynOut.removeLinks();
        }, 100);

        op.log("dynOut unlinked...");
    }
};

function getSubPatchOutputOp()
{
    let patchOutputOP = op.patch.getSubPatchOp(op.patchId.get(), "Ops.Ui.PatchOutput");

    if (!patchOutputOP)
    {
        op.patch.addOp("Ops.Ui.PatchOutput", { "subPatch": op.patchId.get(), "translate": { "x": 0, "y": 0 } });
        patchOutputOP = op.patch.getSubPatchOp(op.patchId.get(), "Ops.Ui.PatchOutput");
        if (!patchOutputOP) op.warn("no patchoutput!");
    }
    return patchOutputOP;
}

function getSubPatchInputOp()
{
    let patchInputOP = op.patch.getSubPatchOp(op.patchId.get(), "Ops.Ui.PatchInput");

    if (!patchInputOP)
    {
        op.patch.addOp("Ops.Ui.PatchInput", { "subPatch": op.patchId.get(), "translate": { "x": 0, "y": 0 } });
        patchInputOP = op.patch.getSubPatchOp(op.patchId.get(), "Ops.Ui.PatchInput");
        if (!patchInputOP) op.warn("no patchinput2!");
    }

    return patchInputOP;
}

op.addSubLink = function (p, p2)
{
    const num = data.ports.length;
    const sublPortname = "in" + (num - 1) + " " + p2.parent.name + " " + p2.name;

    if (p.direction == CABLES.PORT_DIR_IN)
    {
        gui.scene().link(
            p.parent,
            p.getName(),
            getSubPatchInputOp(),
            sublPortname
        );
    }
    else
    {
        const numOut = data.portsOut.length;
        gui.scene().link(
            p.parent,
            p.getName(),
            getSubPatchOutputOp(),
            "out" + (numOut - 1) + " " + p2.parent.name + " " + p2.name
        );
    }

    const bounds = gui.patchView.getSubPatchBounds(op.patchId.get());

    getSubPatchInputOp().uiAttr(
        {
            "translate":
            {
                "x": bounds.minx,
                "y": bounds.miny - 100
            }
        });

    getSubPatchOutputOp().uiAttr(
        {
            "translate":
            {
                "x": bounds.minx,
                "y": bounds.maxy + 100
            }
        });
    saveData();
    return sublPortname;
};

op.onDelete = function ()
{
    for (let i = op.patch.ops.length - 1; i >= 0; i--)
    {
        if (op.patch.ops[i] && op.patch.ops[i].uiAttribs && op.patch.ops[i].uiAttribs.subPatch == op.patchId.get())
        {
            op.patch.deleteOp(op.patch.ops[i].id);
        }
    }
};

function makeBlueprint()
{
    let attribs = {
        "pasted": true,
        "translate": {
            "x": op.uiAttribs.translate.x - 150,
            "y": op.uiAttribs.translate.y
        }
    };

    if (CABLES.UI) attribs.subPatch = gui.patchView.getCurrentSubPatch();

    const bpOp = op.patch.addOp(CABLES.UI.DEFAULTOPNAMES.blueprint, attribs);
    bpOp.createBlueprint(gui.patchId, op.patchId.get(), true);
}

op.rebuildListeners = () =>
{
    op.log("rebuild listeners...");

    const outop = getSubPatchOutputOp();
    for (let i = 0; i < outop.portsIn.length; i++)
    {
        if (outop.portsIn[i].isLinked())
        {
            addPortListener(outop.portsIn[i], this.portsOut[i]);
        }
    }
};


};

Ops.Ui.SubPatch.prototype = new CABLES.Op();
CABLES.OPS["84d9a6f0-ed7a-466d-b386-225ed9e89c60"]={f:Ops.Ui.SubPatch,objName:"Ops.Ui.SubPatch"};




// **************************************************************
// 
// Ops.Boolean.OrNumber
// 
// **************************************************************

Ops.Boolean.OrNumber = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inNum = op.inFloat("Number", 0),
    inOr = op.inFloat("Or", 1),
    result = op.outNumber("Result");

inNum.onChange =
inOr.onChange = update;
update();

function update()
{
    const n = inNum.get();
    if (!n || n != n)result.set(inOr.get());
    else result.set(inNum.get());
}


};

Ops.Boolean.OrNumber.prototype = new CABLES.Op();
CABLES.OPS["beb3c979-5723-4283-a23a-34f4b5038b49"]={f:Ops.Boolean.OrNumber,objName:"Ops.Boolean.OrNumber"};




// **************************************************************
// 
// Ops.Vars.VarSetNumber_v2
// 
// **************************************************************

Ops.Vars.VarSetNumber_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const val = op.inValueFloat("Value", 0);
op.varName = op.inDropDown("Variable", [], "", true);

new CABLES.VarSetOpWrapper(op, "number", val, op.varName);


};

Ops.Vars.VarSetNumber_v2.prototype = new CABLES.Op();
CABLES.OPS["b5249226-6095-4828-8a1c-080654e192fa"]={f:Ops.Vars.VarSetNumber_v2,objName:"Ops.Vars.VarSetNumber_v2"};




// **************************************************************
// 
// Ops.Gl.ForceCanvasSize
// 
// **************************************************************

Ops.Gl.ForceCanvasSize = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inTrigger = op.inTrigger("Trigger"),
    inActive = op.inBool("Active", true),
    inWhat = op.inSwitch("Force", ["Resolution", "Aspect Ratio"], "Resolution"),
    inCenter = op.inBool("Center In Parent", true),
    inScaleFit = op.inBool("Scale to fit Parent", false),
    inWidth = op.inInt("Set Width", 300),
    inHeight = op.inInt("Set Height", 200),
    inPresets = op.inDropDown("Aspect Ratio", ["Custom", "21:9", "2:1", "16:9", "16:10", "4:3", "1:1", "9:16", "1:2", "iPhoneXr Vert"], "16:9"),
    inRatio = op.inFloat("Ratio", 0),
    inStretch = op.inDropDown("Fill Parent", ["Auto", "Width", "Height", "Both"], "Auto"),
    next = op.outTrigger("Next"),
    outWidth = op.outNumber("Width"),
    outHeight = op.outNumber("Height"),
    outMarginLeft = op.outNumber("Margin Left"),
    outMarginTop = op.outNumber("Margin Top");

op.setPortGroup("Size", [inWidth, inHeight]);
op.setPortGroup("Proportions", [inRatio, inStretch, inPresets]);

let align = 0;
const ALIGN_NONE = 0;
const ALIGN_WIDTH = 1;
const ALIGN_HEIGHT = 2;
const ALIGN_BOTH = 3;
const ALIGN_AUTO = 4;

inStretch.onChange = updateUi;
inWhat.onChange = updateMethod;
inCenter.onChange =
    inTrigger.onLinkChanged = removeStyles;

inPresets.onChange = updateRatioPreset;

const cgl = op.patch.cgl;

if (window.getComputedStyle(cgl.canvas).position === "absolute")
{
    cgl.canvas.style.position = "initial";
    op.warn("[cables forceCanvasSize] - canvas was positioned absolute, not compatible with Ops.Gl.ForceCanvasSize");
}

updateUi();

function updateMethod()
{
    if (inWhat.get() == "Aspect Ratio")
    {
        inRatio.set(100);
        updateRatioPreset();
    }
    updateUi();
}

function updateRatioPreset()
{
    const pr = inPresets.get();
    if (pr == "Custom") return;
    else if (pr == "16:9")inRatio.set(16 / 9);
    else if (pr == "4:3")inRatio.set(4 / 3);
    else if (pr == "16:10")inRatio.set(16 / 10);
    else if (pr == "21:9")inRatio.set(21 / 9);
    else if (pr == "2:1")inRatio.set(2);
    else if (pr == "1:1")inRatio.set(1);
    else if (pr == "9:16")inRatio.set(9 / 16);
    else if (pr == "1:2")inRatio.set(0.5);
    else if (pr == "iPhoneXr Vert")inRatio.set(9 / 19.5);
}

inRatio.onChange = () =>
{
    removeStyles();
};

inActive.onChange = function ()
{
    if (!inActive.get())removeStyles();
};

function updateUi()
{
    const forceRes = inWhat.get() == "Resolution";
    inWidth.setUiAttribs({ "greyout": !forceRes });
    inHeight.setUiAttribs({ "greyout": !forceRes });

    inPresets.setUiAttribs({ "greyout": forceRes });
    inStretch.setUiAttribs({ "greyout": forceRes });
    inRatio.setUiAttribs({ "greyout": forceRes });

    align = 0;

    if (!forceRes)
    {
        const strAlign = inStretch.get();
        if (strAlign == "Width")align = ALIGN_WIDTH;
        else if (strAlign == "Height")align = ALIGN_HEIGHT;
        else if (strAlign == "Both")align = ALIGN_BOTH;
        else if (strAlign == "Auto")align = ALIGN_AUTO;
    }
}

function removeStyles()
{
    cgl.canvas.style["margin-top"] = "";
    cgl.canvas.style["margin-left"] = "";

    outMarginLeft.set(0);
    outMarginTop.set(0);

    const rect = cgl.canvas.parentNode.getBoundingClientRect();
    cgl.setSize(rect.width, rect.height);
}

inTrigger.onTriggered = function ()
{
    if (!inActive.get()) return next.trigger();

    let w = inWidth.get();
    let h = inHeight.get();

    let clientRect = cgl.canvas.parentNode.getBoundingClientRect();
    if (clientRect.height == 0)
    {
        cgl.canvas.parentNode.style.height = "100%";
        clientRect = cgl.canvas.parentNode.getBoundingClientRect();
    }
    if (clientRect.width == 0)
    {
        cgl.canvas.parentNode.style.width = "100%";
        clientRect = cgl.canvas.parentNode.getBoundingClientRect();
    }

    if (align == ALIGN_WIDTH)
    {
        w = clientRect.width;
        h = w * 1 / inRatio.get();
    }
    else if (align == ALIGN_HEIGHT)
    {
        h = clientRect.height;
        w = h * inRatio.get();
    }
    else if (align == ALIGN_AUTO)
    {
        const rect = clientRect;

        h = rect.height;
        w = h * inRatio.get();

        if (w > rect.width)
        {
            w = rect.width;
            h = w * 1 / inRatio.get();
        }
    }
    else if (align == ALIGN_BOTH)
    {
        const rect = clientRect;
        h = rect.height;
        w = h * inRatio.get();

        if (w < rect.width)
        {
            w = rect.width;
            h = w * 1 / inRatio.get();
        }
    }

    w = Math.ceil(w);
    h = Math.ceil(h);

    if (inCenter.get())
    {
        const rect = clientRect;

        const t = (rect.height - h) / 2;
        const l = (rect.width - w) / 2;

        outMarginLeft.set(l);
        outMarginTop.set(t);

        cgl.canvas.style["margin-top"] = t + "px";
        cgl.canvas.style["margin-left"] = l + "px";
    }
    else
    {
        cgl.canvas.style["margin-top"] = "0";
        cgl.canvas.style["margin-left"] = "0";

        outMarginLeft.set(0);
        outMarginTop.set(0);
    }

    if (inScaleFit.get())
    {
        const rect = clientRect;
        const scX = rect.width / inWidth.get();
        const scY = rect.height / inHeight.get();
        cgl.canvas.style.transform = "scale(" + Math.min(scX, scY) + ")";
    }
    else
    {
        cgl.canvas.style.transform = "scale(1)";
    }

    if (cgl.canvas.width / cgl.pixelDensity != w || cgl.canvas.height / cgl.pixelDensity != h)
    {
        outWidth.set(w);
        outHeight.set(h);
        cgl.setSize(w, h);
    }
    // else
    next.trigger();
};


};

Ops.Gl.ForceCanvasSize.prototype = new CABLES.Op();
CABLES.OPS["a8b3380e-cd4a-4000-9ee9-1c65a11027dd"]={f:Ops.Gl.ForceCanvasSize,objName:"Ops.Gl.ForceCanvasSize"};




// **************************************************************
// 
// Ops.Math.PowerOfTwoSize
// 
// **************************************************************

Ops.Math.PowerOfTwoSize = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inW = op.inValueInt("Width"),
    inH = op.inValueInt("Height"),
    inStrat = op.inValueSelect("Strategy", ["floor", "floor/2", "ceil"], "floor"),
    outW = op.outNumber("Width Result"),
    outH = op.outNumber("Height Result");
inStrat.onChange = updateStrategy;
inW.onChange = inH.onChange = update;
let getPOT = null;
updateStrategy();

function isPOT(x)
{
    return (x == 1 || x == 2 || x == 4 || x == 8 || x == 16 || x == 32 || x == 64 || x == 128 || x == 256 || x == 512 || x == 1024 || x == 2048 || x == 4096 || x == 8192 || x == 16384);
}

function updateStrategy()
{
    let s = inStrat.get();

    if (s == "floor")getPOT = getPotNextfloor;
    if (s == "floor/2")getPOT = getPotNextfloorx2;
    if (s == "ceil")getPOT = getPotNextBigger;
    if (s == "nearest")getPOT = getPotNearest;

    update();
}

function getPotNextBigger(x)
{
    // if(x>8192)return 16384;
    // if(x>4096)return 8129;
    if (x > 2048) return 4096;
    if (x > 1024) return 2048;
    if (x > 512) return 1024;
    if (x > 256) return 512;
    if (x > 128) return 256;
    if (x > 64) return 128;
    if (x > 32) return 64;
    if (x > 16) return 32;
    if (x > 8) return 16;
    if (x > 4) return 8;
    if (x > 2) return 4;
}

function getPotNextfloorx2(x)
{
    return Math.ceil(getPotNextfloor(x) / 2);
}

function getPotNextfloor(x)
{
    if (x < 2) return 1;
    if (x < 4) return 2;
    if (x < 8) return 4;
    if (x < 16) return 8;
    if (x < 32) return 16;
    if (x < 64) return 32;
    if (x < 128) return 64;
    if (x < 256) return 128;
    if (x < 512) return 256;
    if (x < 1024) return 512;
    if (x < 2048) return 1024;
    if (x < 4096) return 2048;
    if (x < 8192) return 4096;
    // if(x<16384)return 8192;
}

function getPotNearest(x)
{
    if (x > 3072) return 4096;
    if (x > 1536) return 2048;
    if (x > 768) return 1024;
    if (x > 320) return 512;
    if (x > 191) return 256;
    if (x > 95) return 128;
    if (x > 47) return 64;
    if (x > 23) return 32;
    if (x > 11) return 16;
    if (x > 5) return 8;
    if (x > 3) return 4;
    return 2;
}

function update()
{
    let w = inW.get();
    let h = inH.get();

    if (!isPOT(w)) w = getPOT(w);
    if (!isPOT(h)) h = getPOT(h);

    outW.set(w);
    outH.set(h);
}


};

Ops.Math.PowerOfTwoSize.prototype = new CABLES.Op();
CABLES.OPS["58e01e34-0f42-4861-ad9a-ed96e08f8565"]={f:Ops.Math.PowerOfTwoSize,objName:"Ops.Math.PowerOfTwoSize"};




// **************************************************************
// 
// Ops.Trigger.TriggerCounter
// 
// **************************************************************

Ops.Trigger.TriggerCounter = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe = op.inTriggerButton("exe"),
    reset = op.inTriggerButton("reset"),
    trigger = op.outTrigger("trigger"),
    num = op.outNumber("timesTriggered");

op.toWorkPortsNeedToBeLinked(exe);

let n = 0;

reset.onTriggered =
op.onLoaded =
    doReset;

exe.onTriggered = function ()
{
    n++;
    num.set(n);
    op.setUiAttrib({ "extendTitle": n });
    trigger.trigger();
};

function doReset()
{
    n = 0;
    op.setUiAttrib({ "extendTitle": n });
    num.set(n);
}


};

Ops.Trigger.TriggerCounter.prototype = new CABLES.Op();
CABLES.OPS["e640619f-235c-4543-bbf8-b358e0283180"]={f:Ops.Trigger.TriggerCounter,objName:"Ops.Trigger.TriggerCounter"};




// **************************************************************
// 
// Ops.Trigger.TriggerReceive
// 
// **************************************************************

Ops.Trigger.TriggerReceive = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const next = op.outTrigger("Triggered");
op.varName = op.inValueSelect("Named Trigger", [], "", true);

updateVarNamesDropdown();
op.patch.addEventListener("namedTriggersChanged", updateVarNamesDropdown);

let oldName = null;

function doTrigger()
{
    next.trigger();
}

function updateVarNamesDropdown()
{
    if (CABLES.UI)
    {
        let varnames = [];
        let vars = op.patch.namedTriggers;
        // varnames.push('+ create new one');
        for (let i in vars) varnames.push(i);
        op.varName.uiAttribs.values = varnames;
    }
}

op.varName.onChange = function ()
{
    if (oldName)
    {
        let oldCbs = op.patch.namedTriggers[oldName];
        let a = oldCbs.indexOf(doTrigger);
        if (a != -1) oldCbs.splice(a, 1);
    }

    op.setTitle(">" + op.varName.get());
    op.patch.namedTriggers[op.varName.get()] = op.patch.namedTriggers[op.varName.get()] || [];
    let cbs = op.patch.namedTriggers[op.varName.get()];

    cbs.push(doTrigger);
    oldName = op.varName.get();
    updateError();
    op.patch.emitEvent("opTriggerNameChanged", op, op.varName.get());
};

op.on("uiParamPanel", updateError);

function updateError()
{
    if (!op.varName.get())
    {
        op.setUiError("unknowntrigger", "unknown trigger");
    }
    else op.setUiError("unknowntrigger", null);
}


};

Ops.Trigger.TriggerReceive.prototype = new CABLES.Op();
CABLES.OPS["0816c999-f2db-466b-9777-2814573574c5"]={f:Ops.Trigger.TriggerReceive,objName:"Ops.Trigger.TriggerReceive"};




// **************************************************************
// 
// Ops.Html.CSS_v2
// 
// **************************************************************

Ops.Html.CSS_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const code = op.inStringEditor("css code");

code.setUiAttribs(
    {
        "editorSyntax": "css",
        "ignoreBigPort": true
    });

let styleEle = null;
const eleId = "css_" + CABLES.uuid();

code.onChange = update;
update();

function getCssContent()
{
    let css = code.get();
    if (css)
    {
        let patchId = null;
        if (op.storage && op.storage.blueprint && op.storage.blueprint.patchId)
        {
            patchId = op.storage.blueprint.patchId;
        }
        css = css.replace(new RegExp("{{ASSETPATH}}", "g"), op.patch.getAssetPath(patchId));
    }
    return css;
}

function update()
{
    styleEle = document.getElementById(eleId);

    if (styleEle)
    {
        styleEle.textContent = getCssContent();
    }
    else
    {
        styleEle = document.createElement("style");
        styleEle.type = "text/css";
        styleEle.id = eleId;
        styleEle.textContent = attachments.css_spinner;

        const head = document.getElementsByTagName("body")[0];
        head.appendChild(styleEle);
    }
}

op.onDelete = function ()
{
    styleEle = document.getElementById(eleId);
    if (styleEle)styleEle.remove();
};


};

Ops.Html.CSS_v2.prototype = new CABLES.Op();
CABLES.OPS["a56d3edd-06ad-44ed-9810-dbf714600c67"]={f:Ops.Html.CSS_v2,objName:"Ops.Html.CSS_v2"};




// **************************************************************
// 
// Ops.Ui.VizGraph
// 
// **************************************************************

Ops.Ui.VizGraph = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inNum1 = op.inFloat("Number 1"),
    inNum2 = op.inFloat("Number 2"),
    inNum3 = op.inFloat("Number 3"),
    inNum4 = op.inFloat("Number 4"),
    inNum5 = op.inFloat("Number 5"),
    inNum6 = op.inFloat("Number 6"),
    inNum7 = op.inFloat("Number 7"),
    inNum8 = op.inFloat("Number 8"),
    inReset = op.inTriggerButton("Reset");

op.setUiAttrib({ "height": 150, "resizable": true });

let buff = [];

let max = -Number.MAX_VALUE;
let min = Number.MAX_VALUE;

inNum1.onLinkChanged =
    inNum2.onLinkChanged =
    inNum3.onLinkChanged =
    inNum4.onLinkChanged =
    inNum5.onLinkChanged =
    inNum6.onLinkChanged =
    inNum7.onLinkChanged =
    inNum8.onLinkChanged =
    inReset.onTriggered = () =>
    {
        max = -Number.MAX_VALUE;
        min = Number.MAX_VALUE;
        buff = [];
    };

op.renderVizLayer = (ctx, layer) =>
{
    const perf = CABLES.UI.uiProfiler.start("previewlayer graph");

    const colors = [
        "#00ffff",
        "#ffff00",
        "#ff00ff",
        "#0000ff",
        "#00ff00",
        "#ff0000",
        "#ffffff",
        "#888888",
    ];

    ctx.fillStyle = "#222";
    ctx.fillRect(layer.x, layer.y, layer.width, layer.height);

    for (let p = 0; p < op.portsIn.length; p++)
    {
        if (!op.portsIn[p].isLinked()) continue;
        const newVal = op.portsIn[p].get();

        max = Math.max(op.portsIn[p].get(), max);
        min = Math.min(op.portsIn[p].get(), min);

        if (!buff[p]) buff[p] = [];
        buff[p].push(newVal);
        if (buff[p].length > 60) buff[p].shift();

        const texSlot = 5;
        const mulX = layer.width / 60;

        ctx.lineWidth = 2;
        ctx.strokeStyle = "#555555";

        ctx.beginPath();
        ctx.moveTo(layer.x, CABLES.map(0, min, max, layer.height, 0) + layer.y);
        ctx.lineTo(layer.x + layer.width, CABLES.map(0, min, max, layer.height, 0) + layer.y);
        ctx.stroke();

        ctx.strokeStyle = colors[p];

        ctx.beginPath();

        for (let i = 0; i < buff[p].length; i++)
        {
            let y = buff[p][i];

            y = CABLES.map(y, min, max, layer.height, 0);
            y += layer.y;
            if (i === 0)ctx.moveTo(layer.x, y);
            else ctx.lineTo(layer.x + i * mulX, y);
        }

        ctx.stroke();
    }

    ctx.fillStyle = "#888";
    ctx.fillText("max:" + Math.round(max * 100) / 100, layer.x + 10, layer.y + layer.height - 10);
    ctx.fillText("min:" + Math.round(min * 100) / 100, layer.x + 10, layer.y + layer.height - 30);

    perf.finish();
};


};

Ops.Ui.VizGraph.prototype = new CABLES.Op();
CABLES.OPS["13c54eb4-60ef-4b9c-8425-d52a431f5c87"]={f:Ops.Ui.VizGraph,objName:"Ops.Ui.VizGraph"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.Alpha
// 
// **************************************************************

Ops.Gl.TextureEffects.Alpha = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"clearAlpha_frag":"\n// void main()\n// {\n//     outColor.a=0.0;\n// }\n\nIN vec2 texCoord;\nUNI sampler2D tex;\nUNI float amount;\n\n\nvoid main()\n{\n    vec4 base=texture(tex,texCoord);\n\n    outColor=base;\n\n    #ifdef METH_NORM\n        outColor.a=amount;\n    #endif\n    #ifdef METH_ADD\n        outColor.a+=amount;\n    #endif\n    #ifdef METH_SUB\n        outColor.a-=amount;\n    #endif\n    #ifdef METH_MUL\n        outColor.a*=amount;\n    #endif\n\n    #ifdef DO_CLAMP\n    outColor.a=clamp(0.0,1.0,outColor.a);\n    #endif\n\n}\n",};
const
    render = op.inTrigger("Render"),
    amount = op.inValueSlider("Amount", 1),
    meth = op.inSwitch("Method", ["Set", "Add", "Sub", "Mul"], "Set"),
    clamp = op.inBool("Clamp", true),
    trigger = op.outTrigger("Next");

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, "Alpha");
const TEX_SLOT = 0;

shader.setSource(shader.getDefaultVertexShader(), attachments.clearAlpha_frag || "");

const uniformAmount = new CGL.Uniform(shader, "f", "amount", amount);
const textureUniform = new CGL.Uniform(shader, "t", "tex", TEX_SLOT);

clamp.onChange =
    meth.onChange = updateDefines;
updateDefines();

function updateDefines()
{
    shader.toggleDefine("METH_NORM", meth.get() == "Set");
    shader.toggleDefine("METH_ADD", meth.get() == "Add");
    shader.toggleDefine("METH_SUB", meth.get() == "Sub");
    shader.toggleDefine("METH_MUL", meth.get() == "Mul");
    shader.toggleDefine("DO_CLAMP", clamp.get());
}

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(TEX_SLOT, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.TextureEffects.Alpha.prototype = new CABLES.Op();
CABLES.OPS["131687e0-77f5-4fd7-be57-864aa6559418"]={f:Ops.Gl.TextureEffects.Alpha,objName:"Ops.Gl.TextureEffects.Alpha"};




// **************************************************************
// 
// Ops.Patch.Pw01AEC.GetScaleFitFillv3
// 
// **************************************************************

Ops.Patch.Pw01AEC.GetScaleFitFillv3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
// your new op
// have a look at the documentation at:
// https://cables.gl/docs/5_writing_ops/coding_ops


// Create a input port of the type value
const
    inImageWidth   = op.inInt("Image Width"),
    inImageHeight  = op.inInt("Image Height"),
    inCanvasWidth  = op.inInt("Canvas Width"),
    inCanvasHeight = op.inInt("Canvas Height"),
    inEnableFitFill = op.inValueBool("Enable Fit/Fill", true),
    inScaleMode = op.inValueSelect("Fit/Fill", ["Fit", "Fill"], "Fit"),
    inManualScale = op.inFloat("Manual Scalar", 1),
// Create a output port of the type value
    outAdaptScale = op.outNumber("Adaptation Scale"),
    outScaleX  = op.outNumber("Scale X"),
    outScaleY  = op.outNumber("Scale Y"),
    outMultsX  = op.outNumber("Mults X"),
    outMultsY  = op.outNumber("Mults Y")
;

// when input port changes call the function 'update'
inImageWidth.onChange = update;
inImageHeight.onChange = update;
inCanvasWidth.onChange = update;
inCanvasHeight.onChange = update;
inEnableFitFill.onChange = update;
inScaleMode.onChange = update;
inManualScale.onChange = update;


// this function runs every time the input port changes
function update()
{
    let scale = 1
    if (inEnableFitFill.get()) {
        scale = calcScale(  inCanvasWidth.get(), inCanvasHeight.get(),
                            inImageWidth.get(), inImageHeight.get(),
                            inScaleMode.get())

    }

    scale *= inManualScale.get()

    let factorX =  inImageWidth.get() / inCanvasWidth.get()
    let factorY = inImageHeight.get() / inCanvasHeight.get()

    factorX *= scale
    factorY *= scale


    outAdaptScale.set(scale)
    outScaleX.set(factorX)
    outScaleY.set(factorY)
    outMultsX.set(1/factorX)
    outMultsY.set(1/factorY)
}





function calcScale(cwidth, cheight, iwidth, iheight, mode) {

    //Calculate scale value to fill canvas
    var aspectC = cwidth / cheight;
    var aspectI = iwidth / iheight;

    switch (mode) {
      case "Fill":
        if (aspectC >= aspectI) return cwidth / iwidth;
        else return cheight / iheight;
        break;
      case "Fit":
        if (aspectC <= aspectI) return cwidth / iwidth;
        else return cheight / iheight;
        break;
      default:
        return 1;
    }
};

};

Ops.Patch.Pw01AEC.GetScaleFitFillv3.prototype = new CABLES.Op();
CABLES.OPS["ea8e66a7-512c-4270-b750-9a57e49d0075"]={f:Ops.Patch.Pw01AEC.GetScaleFitFillv3,objName:"Ops.Patch.Pw01AEC.GetScaleFitFillv3"};




// **************************************************************
// 
// Ops.Gl.Textures.TextureInfo
// 
// **************************************************************

Ops.Gl.Textures.TextureInfo = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inTex = op.inObject("Texture"),
    outName = op.outNumber("Name"),
    outWidth = op.outNumber("Width"),
    outHeight = op.outNumber("Height"),
    outRatio = op.outNumber("Ratio"),
    outFilter = op.outNumber("Filter"),
    outWrap = op.outNumber("Wrap"),
    outFlipped = op.outBoolNum("Flipped"),
    outFp = op.outBoolNum("HDR"),
    outDefaultEmpty = op.outBoolNum("Is Empty Default Texture", false),
    outDefaultTex = op.outBoolNum("Is Default Texture", false),
    outCubemap = op.outBoolNum("Is Cubemap"),
    outId = op.outNumber("Id");

outFp.setUiAttribs({ "title": "Pixelformat Float 32bit" });

const emptyTex = CGL.Texture.getEmptyTexture(op.patch.cgl);
const defaultTex = CGL.Texture.getTempTexture(op.patch.cgl);

inTex.onChange = function ()
{
    if (inTex.get())
    {
        outName.set(inTex.get().name);
        outWidth.set(inTex.get().width);
        outHeight.set(inTex.get().height);
        outRatio.set(inTex.get().width / inTex.get().height);

        let strFilter = "unknown";
        if (inTex.get().filter == CGL.Texture.FILTER_NEAREST)strFilter = "nearest";
        else if (inTex.get().filter == CGL.Texture.FILTER_LINEAR)strFilter = "linear";
        else if (inTex.get().filter == CGL.Texture.FILTER_MIPMAP)strFilter = "mipmap";

        outFilter.set(inTex.get().filter + " " + strFilter);

        let strWrap = "unknown";

        if (inTex.get().wrap == CGL.Texture.WRAP_CLAMP_TO_EDGE) strWrap = "clamp to edge";
        else if (inTex.get().wrap == CGL.Texture.WRAP_REPEAT) strWrap = "repeat";
        else if (inTex.get().wrap == CGL.Texture.WRAP_MIRRORED_REPEAT) strWrap = "mirrored repeat";

        outWrap.set(inTex.get().wrap + " " + strWrap);

        outId.set(inTex.get().id);
        outFlipped.set(inTex.get().flipped);
        outFp.set(inTex.get().textureType == CGL.Texture.TYPE_FLOAT);

        outCubemap.set(inTex.get().cubemap);
    }
    else
    {
        outName.set("no texture");
        outWidth.set(0);
        outHeight.set(0);
        outRatio.set(0);
        outFilter.set(null);
        outWrap.set(null);
        outId.set(null);
        outFlipped.set(false);
        outFp.set(false);
        outCubemap.set(false);
    }

    outDefaultEmpty.set(inTex.get() == emptyTex);
    outDefaultTex.set(inTex.get() == defaultTex);
};


};

Ops.Gl.Textures.TextureInfo.prototype = new CABLES.Op();
CABLES.OPS["71e5ee4c-3455-4c09-abb2-67abf382f35b"]={f:Ops.Gl.Textures.TextureInfo,objName:"Ops.Gl.Textures.TextureInfo"};




// **************************************************************
// 
// Ops.Math.RoundEven
// 
// **************************************************************

Ops.Math.RoundEven = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inNum = op.inValueFloat("Number"),
    inMode = op.inSwitch("Mode", ["Ceil", "Floor"], "Ceil"),
    result = op.outNumber("Result");

inMode.onChange = inNum.onChange = function ()
{
    let value = 0;
    switch (inMode.get())
    {
    case "Floor":
        value = 2 * (Math.floor(inNum.get() / 2.0));
        break;
    default:
    case "Ceil":
        value = 2 * (Math.round(inNum.get() / 2.0));
        break;
    }
    result.set(value);
};


};

Ops.Math.RoundEven.prototype = new CABLES.Op();
CABLES.OPS["b4c116ba-ab64-4903-80bb-35c8d65819a1"]={f:Ops.Math.RoundEven,objName:"Ops.Math.RoundEven"};




// **************************************************************
// 
// Ops.Math.Sum
// 
// **************************************************************

Ops.Math.Sum = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    number1 = op.inValueFloat("number1", 1),
    number2 = op.inValueFloat("number2", 1),
    result = op.outNumber("result");

op.setTitle("+");

number1.onChange =
number2.onChange = exec;
exec();

function exec()
{
    const v = number1.get() + number2.get();
    if (!isNaN(v))
        result.set(v);
}


};

Ops.Math.Sum.prototype = new CABLES.Op();
CABLES.OPS["c8fb181e-0b03-4b41-9e55-06b6267bc634"]={f:Ops.Math.Sum,objName:"Ops.Math.Sum"};




// **************************************************************
// 
// Ops.Trigger.TriggerExtender
// 
// **************************************************************

Ops.Trigger.TriggerExtender = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inTriggerPort = op.inTriggerButton("Execute"),
    outTriggerPort = op.outTrigger("Next");

inTriggerPort.onTriggered = function ()
{
    outTriggerPort.trigger();
};


};

Ops.Trigger.TriggerExtender.prototype = new CABLES.Op();
CABLES.OPS["7ef594f3-4907-47b0-a2d3-9854eda1679d"]={f:Ops.Trigger.TriggerExtender,objName:"Ops.Trigger.TriggerExtender"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.CheckerBoard_v2
// 
// **************************************************************

Ops.Gl.TextureEffects.CheckerBoard_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"checkerboard_frag":"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI float numX;\nUNI float numY;\nUNI float amount;\nUNI float rotate;\nUNI float aspect;\n\n{{CGL.BLENDMODES3}}\n\n#define PI 3.14159265\n#define TAU (2.0*PI)\n\nvoid pR(inout vec2 p, float a)\n{\n\tp = cos(a)*p + sin(a)*vec2(p.y, -p.x);\n}\n\nvoid main()\n{\n    vec2 uv=texCoord-0.5;\n    pR(uv.xy,rotate * (TAU));\n    // uv = vec2(texCoord.x,texCoord.y*aspect)-0.5;\n\n    #ifdef CENTER\n        uv+=vec2(0.5,0.5);\n    #endif\n\n    float asp=1.0;\n    float nY=numY;\n    #ifdef SQUARE\n        asp=aspect;\n        nY=numX/aspect;\n\n    #endif\n\n    float total = floor(uv.x*numX-numX/2.0) +floor(uv.y/asp*nY-nY/2.0);\n    float r = mod(total,2.0);\n\n    vec4 col=vec4(r,r,r,1.0);\n    vec4 base=texture(tex,texCoord);\n    outColor=cgl_blendPixel(base,col,amount);\n}",};
const render = op.inTrigger("render"),
    blendMode = CGL.TextureEffect.AddBlendSelect(op, "Blend Mode", "normal"),
    maskAlpha = CGL.TextureEffect.AddBlendAlphaMask(op),
    amount = op.inValueSlider("Amount", 1),
    inSquare = op.inBool("Square", true),
    numX = op.inValue("Num X", 10),
    numY = op.inValue("Num Y", 10),
    inRotate = op.inValueSlider("Rotate", 0.0),
    inCentered = op.inBool("Centered", true),
    trigger = op.outTrigger("trigger");

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, "checkerboard");

shader.setSource(shader.getDefaultVertexShader(), attachments.checkerboard_frag);

const textureUniform = new CGL.Uniform(shader, "t", "tex", 0),
    amountUniform = new CGL.Uniform(shader, "f", "amount", amount),
    uniNumX = new CGL.Uniform(shader, "f", "numX", numX),
    uniNumY = new CGL.Uniform(shader, "f", "numY", numY),
    uniAspect = new CGL.Uniform(shader, "f", "aspect", 1),
    rotateUniform = new CGL.Uniform(shader, "f", "rotate", inRotate);

CGL.TextureEffect.setupBlending(op, shader, blendMode, amount, maskAlpha);

inSquare.onChange =
inCentered.onChange = updateDefines;

updateDefines();

function updateDefines()
{
    shader.toggleDefine("CENTER", inCentered.get());
    shader.toggleDefine("SQUARE", inSquare.get());

    numY.setUiAttribs({ "greyout": inSquare.get() });
}

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op, 3)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

    uniAspect.set(cgl.currentTextureEffect.aspectRatio);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.TextureEffects.CheckerBoard_v2.prototype = new CABLES.Op();
CABLES.OPS["7edfae81-f092-413f-a2a0-b109fdffa61d"]={f:Ops.Gl.TextureEffects.CheckerBoard_v2,objName:"Ops.Gl.TextureEffects.CheckerBoard_v2"};




// **************************************************************
// 
// Ops.Math.Compare.LessThan
// 
// **************************************************************

Ops.Math.Compare.LessThan = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const number1 = op.inValue("number1");
const number2 = op.inValue("number2");
const result = op.outBoolNum("result");

op.setTitle("<");

number1.onChange = exec;
number2.onChange = exec;
exec();

function exec()
{
    result.set(number1.get() < number2.get());
}


};

Ops.Math.Compare.LessThan.prototype = new CABLES.Op();
CABLES.OPS["04fd113f-ade1-43fb-99fa-f8825f8814c0"]={f:Ops.Math.Compare.LessThan,objName:"Ops.Math.Compare.LessThan"};




// **************************************************************
// 
// Ops.Html.FullscreenMode
// 
// **************************************************************

Ops.Html.FullscreenMode = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    doRequest = op.inTriggerButton("Request Fullscreen"),
    doExit = op.inTriggerButton("Exit Fullscreen"),
    inEle = op.inSwitch("Element", ["Canvas", "Document"], "Canvas"),
    isFullscreen = op.outBoolNum("Is Fullscreen");

doExit.onTriggered = exitFs;
doRequest.onTriggered = startFs;

let countStarts = 0;

function setState()
{
    const isFull = (!window.screenTop && !window.screenY);
    isFullscreen.set(isFull);
}

function startFs()
{
    countStarts++;
    if (countStarts > 30)
    {
        doRequest.onTriggered = null;
        op.setUiAttrib({ "error": "Fullscreen Request shound not triggered that often: op disabled" });
        exitFs();
    }

    let elem = null;
    if (inEle == "Canvas") elem = op.patch.cgl.canvas.parentElement;
    else elem = document.documentElement;

    if (elem.requestFullScreen) elem.requestFullScreen();
    else if (elem.mozRequestFullScreen) elem.mozRequestFullScreen();
    else if (elem.webkitRequestFullScreen)elem.webkitRequestFullScreen();
    else if (elem.msRequestFullScreen)elem.msRequestFullScreen();

    setTimeout(setState, 100);
    setTimeout(setState, 500);
    setTimeout(setState, 1000);
}

function exitFs()
{
    countStarts--;
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.msExitFullscreen)document.msExitFullscreen();

    setTimeout(setState, 100);
    setTimeout(setState, 500);
    setTimeout(setState, 1000);
}


};

Ops.Html.FullscreenMode.prototype = new CABLES.Op();
CABLES.OPS["fe933b35-696d-4738-be03-c0c011ed67a0"]={f:Ops.Html.FullscreenMode,objName:"Ops.Html.FullscreenMode"};




// **************************************************************
// 
// Ops.Trigger.IfEqualsThen
// 
// **************************************************************

Ops.Trigger.IfEqualsThen = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const exe = op.inTrigger("exe");
let value1 = op.inValue("Value 1", 0);
let value2 = op.inValue("Value 2", 0);

let triggerThen = op.addOutPort(new CABLES.Port(op, "then", CABLES.OP_PORT_TYPE_FUNCTION));
let triggerElse = op.addOutPort(new CABLES.Port(op, "else", CABLES.OP_PORT_TYPE_FUNCTION));

function exec()
{
    if (value1.get() == value2.get())
    {
        triggerThen.trigger();
    }
    else
    {
        triggerElse.trigger();
    }
}

exe.onTriggered = exec;


};

Ops.Trigger.IfEqualsThen.prototype = new CABLES.Op();
CABLES.OPS["e8196d70-d0a6-470a-9448-a7ac0c0e956e"]={f:Ops.Trigger.IfEqualsThen,objName:"Ops.Trigger.IfEqualsThen"};




// **************************************************************
// 
// Ops.Gl.RenderAnim_v2
// 
// **************************************************************

Ops.Gl.RenderAnim_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exec = op.inTrigger("Render"),
    next = op.outTrigger("Next"),
    inType = op.inDropDown("File Type", ["PNG", "JPG", "WebP", "WebM"], "PNG"),
    inZip = op.inBool("ZIP multiple files", false),
    inDownload = op.inBool("Download Files", true),
    inFilePrefix = op.inString("Filename", "cables"),
    inQuality = op.inFloatSlider("Quality", 0.8),
    inDurType = op.inSwitch("Duration Type", ["Seconds", "Frames"], "Seconds"),
    inDuration = op.inInt("Duration", 1),
    inFps = op.inInt("FPS", 30),
    inTransparency = op.inValueBool("Transparency", false),
    useCanvasSize = op.inValueBool("Use Canvas Size", true),
    inWidth = op.inValueInt("texture width", 512),
    inHeight = op.inValueInt("texture height", 512),
    inStart = op.inTriggerButton("Start"),
    outProgress = op.outNumber("Progress", 0),
    outFrame = op.outNumber("Frame", 0),
    outStatus = op.outString("Status", "Waiting"),
    outStarted = op.outBool("Started"),
    outUrl = op.outString("Data URL"),
    outFinished = op.outTrigger("Finished");

op.setPortGroup("File", [inType, inZip, inDownload, inFilePrefix, inQuality]);
op.setPortGroup("Size", [useCanvasSize, inWidth, inHeight]);
op.setPortGroup("Timing", [inFps, inDurType, inDuration]);

outUrl.ignoreValueSerialize = true;

exec.onTriggered = render;

let started = false;
let countFrames = 0;
const finished = true;
let fps = 30;
let numFrames = 31;

const cycle = false;
let shortId = CABLES.shortId();
let frameStarted = false;
const frames = [];
let lastFrame = -1;
let time = 0;

let filenamePrefix = "";

let zip = null;

let oldSizeW = op.patch.cgl.canvasWidth;
let oldSizeH = op.patch.cgl.canvasHeight;

inType.onChange = updateQuality;
useCanvasSize.onChange = updateSize;

updateQuality();
updateSize();

inZip.onChange = () =>
{
    zip = null;
};

function updateQuality()
{
    inQuality.setUiAttribs({ "greyout": inType.get() == "PNG" });
}

function updateSize()
{
    inWidth.setUiAttribs({ "greyout": useCanvasSize.get() });
    inHeight.setUiAttribs({ "greyout": useCanvasSize.get() });
}

inStart.onTriggered = function ()
{
    filenamePrefix = inFilePrefix.get();
    op.log("pref", filenamePrefix);
    frames.length = 0;
    outStatus.set("Starting");
    fps = inFps.get();
    numFrames = inDuration.get() * fps;
    if (inDurType.get() == "Frames")numFrames = inDuration.get();
    shortId = CABLES.shortId();
    updateTime();

    if (inZip.get()) zip = new JSZip();

    if (!useCanvasSize.get())
    {
        oldSizeW = CABLES.patch.cgl.canvasWidth;
        oldSizeH = CABLES.patch.cgl.canvasHeight;
        op.patch.cgl.setSize(inWidth.get() / CABLES.patch.cgl.pixelDensity, inHeight.get() / CABLES.patch.cgl.pixelDensity);
        op.patch.cgl.updateSize();
    }

    if (numFrames == 0)
    {
        countFrames = 0;
        started = true;
    }
    else
    {
        countFrames = -20;
        started = true;
        lastFrame = -9999;
    }
};

function updateTime()
{
    if (numFrames >= 0)
    {
        time = Math.max(0, countFrames * (1.0 / fps));
        op.patch.timer.setTime(time);
        CABLES.overwriteTime = time;// - 1 / fps;
        op.patch.freeTimer.setTime(time);
    }
}

function stopRendering()
{
    started = false;
    CABLES.overwriteTime = undefined;
    outStatus.set("Finished");
}

function render()
{
    outStarted.set(started);

    if (!started)
    {
        next.trigger();
        return;
    }

    const oldInternalNow = CABLES.internalNow;

    if (started)
    {
        CABLES.internalNow = function ()
        {
            return time * 1000;
        };

        updateTime();
        // CABLES.overwriteTime = time;
        // op.patch.timer.setTime(time);
        // op.patch.freeTimer.setTime(time);
    }

    if (lastFrame == countFrames)
    {
        next.trigger();
        return;
    }

    lastFrame = countFrames;

    let prog = countFrames / numFrames;
    if (prog < 0.0) prog = 0.0;
    outProgress.set(prog);
    outFrame.set(countFrames);

    next.trigger();

    CABLES.internalNow = oldInternalNow;

    frameStarted = false;
    if (countFrames > numFrames)
    {
        op.log("FINISHED...");
        op.log("ffmpeg -y -framerate 30 -f image2 -i " + filenamePrefix + "_%d.png  -b 9999k -vcodec mpeg4 " + shortId + ".mp4");

        if (!useCanvasSize.get())
        {
            op.patch.cgl.setSize(oldSizeW, oldSizeH);
            op.patch.cgl.updateSize();
        }

        if (zip)
        {
            zip.generateAsync({ "type": "blob" })
                .then(function (blob)
                {
                    const anchor = document.createElement("a");
                    anchor.download = filenamePrefix + ".zip";
                    anchor.href = URL.createObjectURL(blob);
                    if (inDownload.get())
                    {
                        anchor.click();
                    }
                    stopRendering();
                    if (outUrl.isLinked())
                    {
                        blobToDataURL(blob, (dataUrl) => { outUrl.set(dataUrl); outFinished.trigger(); });
                    }
                    else
                    {
                        outUrl.set(null);
                        outFinished.trigger();
                    }
                });
        }
        else
        if (inType.get() == "WebM")
        {
            try
            {
                outStatus.set("Creating Video File from frames");
                op.log("webm frames", frames.length);

                const video = Whammy.fromImageArray(frames, fps);
                const url = window.URL.createObjectURL(video);
                const anchor = document.createElement("a");

                anchor.setAttribute("download", filenamePrefix + ".webm");
                anchor.setAttribute("href", url);
                document.body.appendChild(anchor);
                if (inDownload.get())
                {
                    anchor.click();
                }
                stopRendering();
                if (outUrl.isLinked())
                {
                    blobToDataURL(video, (dataUrl) => { outUrl.set(dataUrl); outFinished.trigger(); });
                }
                else
                {
                    outUrl.set(null);
                    outFinished.trigger();
                }
            }
            catch (e)
            {
                op.logError(e);
            }

            frames.length = 0;
        }
        else
            stopRendering();

        return;
    }

    let mimetype = "image/png";
    let suffix = "png";

    if (inType.get() == "JPG")
    {
        mimetype = "image/jpeg";
        suffix = "jpg";
    }
    else if (inType.get() == "WebP")
    {
        mimetype = "image/webp";
        suffix = "webp";
    }

    if (countFrames > 0)
    {
        outStatus.set("Rendering Frame " + countFrames + " of " + numFrames);
        op.log("Rendering Frame " + countFrames + " of " + numFrames, time);
        if (inType.get() == "WebM")
        {
            frames.push(op.patch.cgl.canvas.toDataURL("image/webp", inQuality.get() * 0.999));
            countFrames++;
            updateTime();
        }
        else
        {
            op.log("screenshotting frame...", countFrames);
            op.patch.cgl.screenShot((blob) =>
            {
                if (blob)
                {
                    if (zip)
                    {
                        let filename = filenamePrefix + "_" + countFrames + "." + suffix;

                        zip.file(filename, blob, { "base64": false });
                        countFrames++;
                        updateTime();
                    }
                    else
                    {
                        let filename = filenamePrefix + "_" + shortId + "_" + countFrames + "." + suffix;

                        const anchor = document.createElement("a");
                        anchor.download = filename;
                        anchor.href = URL.createObjectURL(blob);

                        setTimeout(() =>
                        {
                            if (outUrl.isLinked())
                            {
                                blobToDataURL(blob, (dataUrl) => { outUrl.set(dataUrl); });
                            }
                            else
                            {
                                outUrl.set(null);
                            }
                            if (inDownload.get())
                            {
                                anchor.click();
                            }
                            countFrames++;
                            updateTime();
                        }, 200);
                    }
                }
                else
                {
                    op.log("screenshot: no blob");
                }
            }, !inTransparency.get(), mimetype, inQuality.get());
        }
    }
    else
    {
        outStatus.set("Prerendering...");
        op.log("pre ", countFrames, time);
        op.patch.cgl.screenShot((blob) =>
        {
            countFrames++;
            updateTime();
        });
    }
}

function blobToDataURL(blob, callback)
{
    let a = new FileReader();
    a.onload = function (e) { callback(e.target.result); };
    a.readAsDataURL(blob);
}


};

Ops.Gl.RenderAnim_v2.prototype = new CABLES.Op();
CABLES.OPS["c05e54a3-3ed5-4941-a412-01134f53f0ac"]={f:Ops.Gl.RenderAnim_v2,objName:"Ops.Gl.RenderAnim_v2"};




// **************************************************************
// 
// Ops.Cables.PatchInfo_v2
// 
// **************************************************************

Ops.Cables.PatchInfo_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const outConfig = op.outObject("Config");
const outName = op.outString("Name");
const outPatchId = op.outString("Patch Id");
const outNamespace = op.outString("Namespace");
const outSaveDate = op.outNumber("Last Saved");
const outExportDate = op.outNumber("Last Exported");

const patch = getPatch();

outConfig.set(patch.config);
outName.set(patch.name);
outPatchId.set(getPatchId());
outNamespace.set(patch.namespace);
outSaveDate.set(getLastSaveDate());
outExportDate.set(getLastExportDate());

function getPatchId()
{
    let id = null;
    if (patch && patch._id) id = patch._id;
    if (patch && patch.config && patch.config.patch && patch.config.patch._id) id = patch.config.patch._id;
    if (window.gui && window.gui.patchId) id = window.gui.patchId;
    if (window.CABLES && window.CABLES.patchId) id = window.CABLES.patchId;
    if (CABLES.patchId) id = CABLES.patchId;
    return id;
}

function getLastSaveDate()
{
    let date = null;
    if (patch && patch.config && patch.config.patch) date = patch.config.patch.updated;
    if (window.gui && window.gui.project) date = window.gui.project().updated;
    return new Date(date).getTime();
}

function getLastExportDate()
{
    let date = null;
    if (patch && patch.config && patch.config.patch)
    {
        if (patch.config.patch.deployments && patch.config.patch.deployments.lastDeployment)
        {
            date = patch.config.patch.deployments.lastDeployment.date;
        }
    }
    if (window.gui && window.gui.project)
    {
        const p = window.gui.project();
        if (p.deployments && p.deployments.lastDeployment)
        {
            date = p.deployments.lastDeployment.date;
        }
    }
    return new Date(date).getTime();
}

function getPatch()
{
    let thePatch = null;
    if (CABLES && CABLES.exportedPatch) thePatch = CABLES.exportedPatch;
    if (CABLES && CABLES.patch) thePatch = CABLES.patch;
    if (op.patch) thePatch = op.patch;
    return thePatch;
}


};

Ops.Cables.PatchInfo_v2.prototype = new CABLES.Op();
CABLES.OPS["7187c2f2-67a9-479e-92c4-0e415443f504"]={f:Ops.Cables.PatchInfo_v2,objName:"Ops.Cables.PatchInfo_v2"};




// **************************************************************
// 
// Ops.String.StringReplace
// 
// **************************************************************

Ops.String.StringReplace = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inStr = op.inString("String"),
    inSearch = op.inString("Search For", "foo"),
    inRepl = op.inString("Replace", "bar"),
    inWhat = op.inSwitch("Replace What", ["All", "First"], "All"),
    outStr = op.outString("Result");

inRepl.onChange =
inStr.onChange =
inWhat.onChange =
inSearch.onChange = update;

function update()
{
    op.setUiError("exception", null);

    let str = "";
    try
    {
        if (inWhat.get() == "All") str = String(inStr.get()).replace(new RegExp(inSearch.get(), "g"), inRepl.get());
        else str = String(inStr.get()).replace(inSearch.get(), inRepl.get());
    }
    catch (e)
    {
        op.setUiError("exception", "exception " + e.message);
    }

    outStr.set(str);
}


};

Ops.String.StringReplace.prototype = new CABLES.Op();
CABLES.OPS["4a053e7a-6b00-4e71-bd51-90cdb190994c"]={f:Ops.String.StringReplace,objName:"Ops.String.StringReplace"};




// **************************************************************
// 
// Ops.Date.DateFormatter
// 
// **************************************************************

Ops.Date.DateFormatter = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const inTimestamp = op.inValue("Timestamp");
const inDate = op.inObject("Date");
const inFormat = op.inString("Format", "YYYY-MM-DD");
const outString = op.outString("StringDate");

inTimestamp.onChange = function ()
{
    const ts = inTimestamp.get();
    update(new Date(ts));
};
inDate.onChange = function ()
{
    const date = inDate.get();
    update(date);
};
inFormat.onChange = function ()
{
    update(new Date());
};

function update(date)
{
    const m = moment(date);
    const f = inFormat.get();
    outString.set(m.format(f));
}


};

Ops.Date.DateFormatter.prototype = new CABLES.Op();
CABLES.OPS["8933d01f-39ac-428c-a64b-902c534a4fc0"]={f:Ops.Date.DateFormatter,objName:"Ops.Date.DateFormatter"};




// **************************************************************
// 
// Ops.String.ConcatMulti_v2
// 
// **************************************************************

Ops.String.ConcatMulti_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const addSpacesCheckBox = op.inBool("add spaces", false),
    newLinesCheckBox = op.inBool("new lines", false),
    stringPorts = [],
    result = op.outString("concat string");

stringPorts.onChange = addSpacesCheckBox.onChange =
newLinesCheckBox.onChange = update;

addSpacesCheckBox.setUiAttribs({ "hidePort": true });
newLinesCheckBox.setUiAttribs({ "hidePort": true });

for (let i = 0; i < 8; i++)
{
    let p = op.inString("string " + i);
    stringPorts.push(p);
    p.onChange = update;
}

function update()
{
    let str = "";
    let nl = "";
    let space = addSpacesCheckBox.get();

    for (let i = 0; i < stringPorts.length; i++)
    {
        const inString = stringPorts[i].get();
        if (!inString) continue;
        if (i > 0 && space) str += " ";
        if (i > 0 && newLinesCheckBox.get()) nl = "\n";
        str += nl;
        str += inString;
    }
    result.set(str);
}


};

Ops.String.ConcatMulti_v2.prototype = new CABLES.Op();
CABLES.OPS["bc110e48-812d-489d-b1b3-b09c644c6982"]={f:Ops.String.ConcatMulti_v2,objName:"Ops.String.ConcatMulti_v2"};




// **************************************************************
// 
// Ops.Ui.VizString
// 
// **************************************************************

Ops.Ui.VizString = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const inStr = op.inString("String", "");
const outNum = op.outString("Result");

op.setUiAttrib({ "widthOnlyGrow": true });

inStr.onChange = () =>
{
    let str = inStr.get();
    if (op.patch.isEditorMode())
    {
        if (str === null)str = "null";
        else if (str === undefined)str = "undefined";
        else str = "\"" + (String(str) || "") + "\"";
        op.setTitle(str);
    }

    outNum.set(inStr.get());
};


};

Ops.Ui.VizString.prototype = new CABLES.Op();
CABLES.OPS["b04ff547-f557-4a54-a3ad-8a668fe1303d"]={f:Ops.Ui.VizString,objName:"Ops.Ui.VizString"};




// **************************************************************
// 
// Ops.Devices.Keyboard.KeyPressLearn
// 
// **************************************************************

Ops.Devices.Keyboard.KeyPressLearn = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const learnedKeyCode = op.inValueInt("key code");
const canvasOnly = op.inValueBool("canvas only", true);
const modKey = op.inValueSelect("Mod Key", ["none", "alt"], "none");
const inEnable = op.inValueBool("Enabled", true);
const preventDefault = op.inValueBool("Prevent Default");
const learn = op.inTriggerButton("learn");
const onPress = op.outTrigger("on press");
const onRelease = op.outTrigger("on release");
const outPressed = op.outBoolNum("Pressed", false);
const outKey = op.outString("Key");

const cgl = op.patch.cgl;
let learning = false;

modKey.onChange = learnedKeyCode.onChange = updateKeyName;

function onKeyDown(e)
{
    if (learning)
    {
        learnedKeyCode.set(e.keyCode);
        if (CABLES.UI)
        {
            op.refreshParams();
        }
        // op.log("Learned key code: " + learnedKeyCode.get());
        learning = false;
        removeListeners();
        addListener();

        if (CABLES.UI)gui.emitEvent("portValueEdited", op, learnedKeyCode, learnedKeyCode.get());
    }
    else
    {
        if (e.keyCode == learnedKeyCode.get())
        {
            if (modKey.get() == "alt")
            {
                if (e.altKey === true)
                {
                    onPress.trigger();
                    outPressed.set(true);
                    if (preventDefault.get())e.preventDefault();
                }
            }
            else
            {
                onPress.trigger();
                outPressed.set(true);
                if (preventDefault.get())e.preventDefault();
            }
        }
    }
}

function onKeyUp(e)
{
    if (e.keyCode == learnedKeyCode.get())
    {
        // op.log("Key released, key code: " + e.keyCode);
        onRelease.trigger();
        outPressed.set(false);
    }
}

op.onDelete = function ()
{
    cgl.canvas.removeEventListener("keyup", onKeyUp, false);
    cgl.canvas.removeEventListener("keydown", onKeyDown, false);
    document.removeEventListener("keyup", onKeyUp, false);
    document.removeEventListener("keydown", onKeyDown, false);
};

learn.onTriggered = function ()
{
    // op.log("Listening for key...");
    learning = true;
    addDocumentListener();

    setTimeout(function ()
    {
        learning = false;
        removeListeners();
        addListener();
    }, 3000);
};

function addListener()
{
    if (canvasOnly.get()) addCanvasListener();
    else addDocumentListener();
}

function removeListeners()
{
    document.removeEventListener("keydown", onKeyDown, false);
    document.removeEventListener("keyup", onKeyUp, false);
    cgl.canvas.removeEventListener("keydown", onKeyDown, false);
    cgl.canvas.removeEventListener("keyup", onKeyUp, false);
    outPressed.set(false);
}

function addCanvasListener()
{
    if (!CABLES.UTILS.isNumeric(cgl.canvas.getAttribute("tabindex"))) cgl.canvas.setAttribute("tabindex", 1);

    cgl.canvas.addEventListener("keydown", onKeyDown, false);
    cgl.canvas.addEventListener("keyup", onKeyUp, false);
}

function addDocumentListener()
{
    document.addEventListener("keydown", onKeyDown, false);
    document.addEventListener("keyup", onKeyUp, false);
}

inEnable.onChange = function ()
{
    if (!inEnable.get())
    {
        removeListeners();
    }
    else
    {
        addListener();
    }
};

canvasOnly.onChange = function ()
{
    removeListeners();
    addListener();
};

function updateKeyName()
{
    let keyName = CABLES.keyCodeToName(learnedKeyCode.get());
    const modKeyName = modKey.get();
    if (modKeyName && modKeyName !== "none")
    {
        keyName = modKeyName.charAt(0).toUpperCase() + modKeyName.slice(1) + "-" + keyName;
    }
    op.setUiAttribs({ "extendTitle": keyName });
    outKey.set(keyName);
}

addCanvasListener();


};

Ops.Devices.Keyboard.KeyPressLearn.prototype = new CABLES.Op();
CABLES.OPS["f069c0db-4051-4eae-989e-6ef7953787fd"]={f:Ops.Devices.Keyboard.KeyPressLearn,objName:"Ops.Devices.Keyboard.KeyPressLearn"};




// **************************************************************
// 
// Ops.Date.DateAndTime
// 
// **************************************************************

Ops.Date.DateAndTime = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
let UPDATE_RATE_DEFAULT = 500;
let UPDATE_RATE_MIN = 50;
let updateRate = UPDATE_RATE_DEFAULT;

const
    outYear = op.outNumber("Year"),
    outMonth = op.outNumber("Month"),
    outDay = op.outNumber("Day"),
    outHours = op.outNumber("Hours"),
    outMinutes = op.outNumber("Minutes"),
    outSeconds = op.outNumber("Seconds"),
    outTimestemp = op.outNumber("Timestamp"),
    updateRatePort = op.inInt("Update Rate", UPDATE_RATE_DEFAULT);

let d = new Date();

let timeout = setTimeout(update, UPDATE_RATE_DEFAULT);
update();

function update()
{
    d = new Date();

    outSeconds.set(d.getSeconds());
    outMinutes.set(d.getMinutes());
    outHours.set(d.getHours());
    outDay.set(d.getDate());
    outMonth.set(d.getMonth());
    outYear.set(d.getFullYear());

    timeout = setTimeout(update, updateRate);

    outTimestemp.set(Date.now());
}

updateRatePort.onChange = function ()
{
    let newUpdateRate = updateRatePort.get();
    if (newUpdateRate && newUpdateRate >= UPDATE_RATE_MIN)
    {
        updateRate = newUpdateRate;
    }
};

op.onDelete = function ()
{
    clearTimeout(timeout);
};


};

Ops.Date.DateAndTime.prototype = new CABLES.Op();
CABLES.OPS["beff95ec-7b50-4b6e-80b8-a7e4ab97d8cc"]={f:Ops.Date.DateAndTime,objName:"Ops.Date.DateAndTime"};




// **************************************************************
// 
// Ops.Html.DivElement_v3
// 
// **************************************************************

Ops.Html.DivElement_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inText = op.inString("Text", "Hello Div"),
    inId = op.inString("Id"),
    inClass = op.inString("Class"),
    inStyle = op.inStringEditor("Style", "position:absolute;\nz-index:100;", "inline-css"),
    inInteractive = op.inValueBool("Interactive", false),
    inVisible = op.inValueBool("Visible", true),
    inBreaks = op.inValueBool("Convert Line Breaks", false),
    inPropagation = op.inValueBool("Propagate Click-Events", true),
    outElement = op.outObject("DOM Element", null, "element"),
    outHover = op.outBoolNum("Hover"),
    outClicked = op.outTrigger("Clicked");

let listenerElement = null;
let oldStr = null;
let prevDisplay = "block";
let div = null;

const canvas = op.patch.cgl.canvas.parentElement;

createElement();

inClass.onChange = updateClass;
inBreaks.onChange = inText.onChange = updateText;
inStyle.onChange = updateStyle;
inInteractive.onChange = updateInteractive;
inVisible.onChange = updateVisibility;

updateText();
updateStyle();
warning();
updateInteractive();

op.onDelete = removeElement;

outElement.onLinkChanged = updateStyle;

function createElement()
{
    div = document.createElement("div");
    div.dataset.op = op.id;
    div.classList.add("cablesEle");

    if (inId.get()) div.id = inId.get();

    canvas.appendChild(div);
    outElement.set(div);
}

function removeElement()
{
    if (div) removeClasses();
    if (div && div.parentNode) div.parentNode.removeChild(div);
    oldStr = null;
    div = null;
}

function setCSSVisible(visible)
{
    if (!visible)
    {
        div.style.visibility = "hidden";
        prevDisplay = div.style.display || "block";
        div.style.display = "none";
    }
    else
    {
        // prevDisplay=div.style.display||'block';
        if (prevDisplay == "none") prevDisplay = "block";
        div.style.visibility = "visible";
        div.style.display = prevDisplay;
    }
}

function updateVisibility()
{
    setCSSVisible(inVisible.get());
}

function updateText()
{
    let str = inText.get();

    if (oldStr === str) return;
    oldStr = str;

    if (str && inBreaks.get()) str = str.replace(/(?:\r\n|\r|\n)/g, "<br>");

    if (div.innerHTML != str) div.innerHTML = str;
    outElement.set(null);
    outElement.set(div);
}

// inline css inisde div
function updateStyle()
{
    if (!div) return;
    // if (inStyle.get() != div.style)
    // {
    div.setAttribute("style", inStyle.get());
    updateVisibility();
    outElement.set(null);
    outElement.set(div);
    // }

    if (!div.parentElement)
    {
        canvas.appendChild(div);
    }

    warning();
}

let oldClassesStr = "";

function removeClasses()
{
    if (!div) return;

    const classes = (inClass.get() || "").split(" ");
    for (let i = 0; i < classes.length; i++)
    {
        if (classes[i]) div.classList.remove(classes[i]);
    }
    oldClassesStr = "";
}

function updateClass()
{
    const classes = (inClass.get() || "").split(" ");
    const oldClasses = (oldClassesStr || "").split(" ");

    let found = false;

    for (let i = 0; i < oldClasses.length; i++)
    {
        if (
            oldClasses[i] &&
            classes.indexOf(oldClasses[i].trim()) == -1)
        {
            found = true;
            div.classList.remove(oldClasses[i]);
        }
    }

    for (let i = 0; i < classes.length; i++)
    {
        if (classes[i])
        {
            div.classList.add(classes[i].trim());
        }
    }

    oldClassesStr = inClass.get();
    warning();
}

function onMouseEnter(e)
{
    outHover.set(true);
}

function onMouseLeave(e)
{
    outHover.set(false);
}

function onMouseClick(e)
{
    if (!inPropagation.get())
    {
        e.stopPropagation();
    }
    outClicked.trigger();
}

function updateInteractive()
{
    removeListeners();
    if (inInteractive.get()) addListeners();
}

inId.onChange = function ()
{
    div.id = inId.get();
};

function removeListeners()
{
    if (listenerElement)
    {
        listenerElement.removeEventListener("pointerdown", onMouseClick);
        listenerElement.removeEventListener("pointerleave", onMouseLeave);
        listenerElement.removeEventListener("pointerenter", onMouseEnter);
        listenerElement = null;
    }
}

function addListeners()
{
    if (listenerElement)removeListeners();

    listenerElement = div;

    if (listenerElement)
    {
        listenerElement.addEventListener("pointerdown", onMouseClick);
        listenerElement.addEventListener("pointerleave", onMouseLeave);
        listenerElement.addEventListener("pointerenter", onMouseEnter);
    }
}

op.addEventListener("onEnabledChange", function (enabled)
{
    removeElement();
    if (enabled)
    {
        createElement();
        updateStyle();
        updateClass();
        updateText();
        updateInteractive();
    }
    // if(enabled) updateVisibility();
    // else setCSSVisible(false);
});

function warning()
{
    if (inClass.get() && inStyle.get())
    {
        op.setUiError("error", "DIV uses external and inline CSS", 1);
    }
    else
    {
        op.setUiError("error", null);
    }
}


};

Ops.Html.DivElement_v3.prototype = new CABLES.Op();
CABLES.OPS["d55d398c-e68e-486b-b0ce-d9c4bdf7df05"]={f:Ops.Html.DivElement_v3,objName:"Ops.Html.DivElement_v3"};




// **************************************************************
// 
// Ops.Vars.VarSetString_v2
// 
// **************************************************************

Ops.Vars.VarSetString_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const val=op.inString("Value","New String");
op.varName=op.inDropDown("Variable",[],"",true);

new CABLES.VarSetOpWrapper(op,"string",val,op.varName);




};

Ops.Vars.VarSetString_v2.prototype = new CABLES.Op();
CABLES.OPS["0b4d9229-8024-4a30-9cc0-f6653942c2e4"]={f:Ops.Vars.VarSetString_v2,objName:"Ops.Vars.VarSetString_v2"};




// **************************************************************
// 
// Ops.Gl.ValidTexture
// 
// **************************************************************

Ops.Gl.ValidTexture = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
 const
    inTex=op.inTexture("Texture"),
    inWhich=op.inSwitch("Default",['Empty','Stripes'],'Empty'),
    outTex=op.outTexture("Result");


let tex=CGL.Texture.getEmptyTexture(op.patch.cgl);

inWhich.onChange=function()
{
    if(inWhich.get()=="Empty")tex=CGL.Texture.getEmptyTexture(op.patch.cgl);
    else tex=CGL.Texture.getTempTexture(op.patch.cgl);
};

inTex.onChange=function()
{
    let t=inTex.get();

    if(!t) t=tex;

    outTex.set(t);
};

};

Ops.Gl.ValidTexture.prototype = new CABLES.Op();
CABLES.OPS["51c24850-aa8b-41e4-936e-68ba718b5e39"]={f:Ops.Gl.ValidTexture,objName:"Ops.Gl.ValidTexture"};




// **************************************************************
// 
// Ops.Boolean.Not
// 
// **************************************************************

Ops.Boolean.Not = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    bool = op.inValueBool("Boolean"),
    outbool = op.outBoolNum("Result");

bool.changeAlways = true;

bool.onChange = function ()
{
    outbool.set((!bool.get()));
};


};

Ops.Boolean.Not.prototype = new CABLES.Op();
CABLES.OPS["6d123c9f-7485-4fd9-a5c2-76e59dcbeb34"]={f:Ops.Boolean.Not,objName:"Ops.Boolean.Not"};




// **************************************************************
// 
// Ops.Boolean.ToggleBool_v2
// 
// **************************************************************

Ops.Boolean.ToggleBool_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    trigger = op.inTriggerButton("trigger"),
    reset = op.inTriggerButton("reset"),
    inDefault = op.inBool("Default", false),
    outBool = op.outBoolNum("result");

let theBool = false;

op.onLoadedValueSet = () =>
{
    outBool.set(inDefault.get());
};

trigger.onTriggered = function ()
{
    theBool = !theBool;
    outBool.set(theBool);
};

reset.onTriggered = function ()
{
    theBool = inDefault.get();
    outBool.set(theBool);
};


};

Ops.Boolean.ToggleBool_v2.prototype = new CABLES.Op();
CABLES.OPS["4313d9bb-96b6-43bc-9190-6068cfb2593c"]={f:Ops.Boolean.ToggleBool_v2,objName:"Ops.Boolean.ToggleBool_v2"};




// **************************************************************
// 
// Ops.Json.AjaxRequest_v2
// 
// **************************************************************

Ops.Json.AjaxRequest_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const filename = op.inUrl("file"),
    jsonp = op.inValueBool("JsonP", false),
    headers = op.inObject("headers", {}),
    inBody = op.inStringEditor("body", ""),
    inMethod = op.inDropDown("HTTP Method", ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "CONNECT", "OPTIONS", "TRACE"], "GET"),
    inContentType = op.inString("Content-Type", "application/json"),
    inParseJson = op.inBool("parse json", true),
    inAutoRequest = op.inBool("Auto request", true),
    reloadTrigger = op.inTriggerButton("reload"),
    outData = op.outObject("data"),
    outString = op.outString("response"),
    outDuration = op.outNumber("Duration MS", 0),
    outStatus = op.outNumber("Status Code", 0),

    isLoading = op.outBoolNum("Is Loading", false),
    outTrigger = op.outTrigger("Loaded");

filename.setUiAttribs({ "title": "URL" });
reloadTrigger.setUiAttribs({ "buttonTitle": "trigger request" });

outData.ignoreValueSerialize = true;
outString.ignoreValueSerialize = true;

inAutoRequest.onChange = filename.onChange = jsonp.onChange = headers.onChange = inMethod.onChange = inParseJson.onChange = function ()
{
    delayedReload(false);
};

reloadTrigger.onTriggered = function ()
{
    delayedReload(true);
};

let reloadTimeout = 0;

function delayedReload(force = false)
{
    clearTimeout(reloadTimeout);
    reloadTimeout = setTimeout(function () { reload(null, force); }, 100);
}

op.onFileChanged = function (fn)
{
    if (filename.get() && filename.get().indexOf(fn) > -1) reload(true);
};

function reload(addCachebuster, force = false)
{
    if (!inAutoRequest.get() && !force) return;
    if (!filename.get()) return;

    // op.patch.loading.finished(loadingId);

    const loadingId = op.patch.loading.start("jsonFile", "" + filename.get(), op);
    isLoading.set(true);

    op.setUiAttrib({ "extendTitle": CABLES.basename(filename.get()) });
    op.setUiError("jsonerr", null);

    let httpClient = CABLES.ajax;
    if (jsonp.get()) httpClient = CABLES.jsonp;

    let url = op.patch.getFilePath(filename.get());
    if (addCachebuster)url += "?rnd=" + CABLES.generateUUID();

    op.patch.loading.addAssetLoadingTask(() =>
    {
        const body = inBody.get();
        const startTime = performance.now();
        httpClient(
            url,
            (err, _data, xhr) =>
            {
                outDuration.set(Math.round(performance.now() - startTime));
                outData.set(null);
                outString.set(null);
                outStatus.set(xhr.status);

                // if (err)
                // {
                //     op.logError(err);
                //     // op.patch.loading.finished(loadingId);
                //     // isLoading.set(false);
                //     // return;
                // }
                try
                {
                    let data = _data;
                    if (typeof data === "string" && inParseJson.get())
                    {
                        data = JSON.parse(_data);
                        outData.set(data);
                    }
                    outString.set(_data);
                    op.uiAttr({ "error": null });
                    op.patch.loading.finished(loadingId);
                    outTrigger.trigger();
                    isLoading.set(false);
                }
                catch (e)
                {
                    op.logError(e);
                    op.setUiError("jsonerr", "Problem while loading json:<br/>" + e);
                    op.patch.loading.finished(loadingId);
                    isLoading.set(false);
                }
            },
            inMethod.get(),
            (body && body.length > 0) ? body : null,
            inContentType.get(),
            null,
            headers.get() || {}
        );
    });
}


};

Ops.Json.AjaxRequest_v2.prototype = new CABLES.Op();
CABLES.OPS["e0879058-5505-4dc4-b9ff-47a3d3c8a71a"]={f:Ops.Json.AjaxRequest_v2,objName:"Ops.Json.AjaxRequest_v2"};




// **************************************************************
// 
// Ops.Json.ObjectGetArrayValuesByPath
// 
// **************************************************************

Ops.Json.ObjectGetArrayValuesByPath = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const objectIn = op.inObject("Object");
const pathIn = op.inString("Path");
const resultOut = op.outArray("Output");
const foundOut = op.outBool("Found");

objectIn.onChange = update;
pathIn.onChange = update;

function update()
{
    const data = objectIn.get();
    let result = [];
    const path = pathIn.get();
    op.setUiError("path", null);

    if (data && path)
    {
        if (typeof data !== "object")
        {
            foundOut.set(false);
            op.setUiError("notiterable", "input object of type " + (typeof data) + " is not travesable by path");
        }
        else if (Array.isArray(data))
        {
            foundOut.set(false);
            op.setUiError("notiterable", "input of type " + (typeof data) + " is not an object");
        }
        else
        {
            op.setUiError("notiterable", null);
            const parts = path.split(".");
            foundOut.set(false);

            // find first array in path
            let checkPath = "";
            let pathPrefix = "";
            let pathSuffix = "";
            let checkData = null;
            for (let i = 0; i < parts.length; i++)
            {
                checkPath += parts[i];
                checkData = resolve(checkPath, data);
                if (Array.isArray(checkData))
                {
                    pathPrefix = checkPath;
                    pathSuffix = parts.splice(i + 2, parts.length - (i + 2)).join(".");
                    break;
                }
                checkPath += ".";
            }
            if (checkData)
            {
                if (parts.length > 1)
                {
                    for (let i = 0; i < checkData.length; i++)
                    {
                        let resolvePath = pathPrefix + "." + i;
                        if (pathSuffix && pathSuffix !== "")
                        {
                            resolvePath += "." + pathSuffix;
                        }
                        const resolvedData = resolve(resolvePath, data);
                        if (typeof resolvedData !== "undefined")
                        {
                            foundOut.set(true);
                        }
                        result.push(resolvedData);
                    }
                }
                else
                {
                    if (Array.isArray(checkData))
                    {
                        result = checkData;
                    }
                    else
                    {
                        result = [checkData];
                    }
                    foundOut.set(true);
                }

                const titleParts = pathIn.get().split(".");
                const extendTitle = titleParts[titleParts.length - 1] + "";
                op.setUiAttrib({ "extendTitle": extendTitle });
            }
            if (foundOut.get())
            {
                resultOut.setRef(result);
            }
            else
            {
                op.setUiError("path", "given path seems to be invalid!", 1);
                resultOut.setRef([]);
            }
        }
    }
    else
    {
        foundOut.set(false);
    }
}

function resolve(path, obj = self, separator = ".")
{
    const properties = Array.isArray(path) ? path : path.split(separator);
    return properties.reduce((prev, curr) => { return prev && prev[curr]; }, obj);
}


};

Ops.Json.ObjectGetArrayValuesByPath.prototype = new CABLES.Op();
CABLES.OPS["609a645e-5e24-4a5e-a379-804c5b64f5d5"]={f:Ops.Json.ObjectGetArrayValuesByPath,objName:"Ops.Json.ObjectGetArrayValuesByPath"};




// **************************************************************
// 
// Ops.Gl.TextureArrayLoaderFromArray_v2
// 
// **************************************************************

Ops.Gl.TextureArrayLoaderFromArray_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    filenames = op.inArray("urls"),
    tfilter = op.inDropDown("filter", ["nearest", "linear", "mipmap"], "linear"),
    wrap = op.inDropDown("wrap", ["repeat", "mirrored repeat", "clamp to edge"], "repeat"),
    flip = op.inBool("Flip", false),
    unpackAlpha = op.inBool("unpackPreMultipliedAlpha", false),
    inCaching = op.inBool("Caching", false),
    inPatchAsset = op.inBool("Asset in patch", false),
    arrOut = op.outArray("TextureArray"),
    width = op.outNumber("width"),
    height = op.outNumber("height"),
    loading = op.outBoolNum("loading"),
    ratio = op.outNumber("Aspect Ratio");

op.toWorkPortsNeedToBeLinked(filenames);

const cgl = op.patch.cgl;
const arr = [];
let cgl_filter = CGL.Texture.FILTER_LINEAR;
let cgl_wrap = CGL.Texture.WRAP_MIRRORED_REPEAT;
let loadingId = null;
let timedLoader = 0;
arrOut.set(arr);

inPatchAsset.onChange =
    flip.onChange =
    unpackAlpha.onChange =
    filenames.onChange = reload;

tfilter.onChange = onFilterChange;
wrap.onChange = onWrapChange;

function reload(nocache)
{
    if (!filenames.isLinked())
    {
        arrOut.setRef(null);
        return;
    }
    clearTimeout(timedLoader);
    timedLoader = setTimeout(function ()
    {
        realReload(nocache);
    }, 30);
}

function loadImage(_i, _url, nocache, cb)
{
    let url = _url;
    const i = _i;
    if (!url) return;

    if (inPatchAsset.get())
    {
        let patchId = null;
        if (op.storage && op.storage.blueprint && op.storage.blueprint.patchId)
        {
            patchId = op.storage.blueprint.patchId;
        }
        url = op.patch.getAssetPath(patchId) + url;
    }

    url = op.patch.getFilePath(url);

    if (!inCaching.get()) if (nocache)url += "?rnd=" + CABLES.generateUUID();

    let tex = CGL.Texture.load(cgl, url,
        function (err)
        {
            if (err)
            {
                const errMsg = "could not load texture \"" + url + "\"";
                op.uiAttr({ "error": errMsg });
                op.warn("[TextureArrayLoader] " + errMsg);
                if (cb)cb();
                return;
            }
            else op.uiAttr({ "error": null });

            width.set(tex.width);
            height.set(tex.height);
            ratio.set(tex.width / tex.height);

            arr[i] = tex;

            arrOut.setRef(arr);
            if (cb)cb();
        }, {
            "wrap": cgl_wrap,
            "flip": flip.get(),
            "unpackAlpha": unpackAlpha.get(),
            "filter": cgl_filter
        });
}

function realReload(nocache)
{
    const files = filenames.get();

    if (!files || files.length == 0) return;

    if (loadingId)cgl.patch.loading.finished(loadingId);

    loadingId = cgl.patch.loading.start("texturearray", CABLES.uuid(), op);
    loading.set(true);

    for (let i = 0; i < files.length; i++)
    {
        arr[i] = CGL.Texture.getEmptyTexture(cgl);
        let cb = null;
        if (i == files.length - 1)
        {
            cb = () =>
            {
                loading.set(false);
                cgl.patch.loading.finished(loadingId);
            };
        }

        if (!files[i]) { if (cb) cb(); }
        else loadImage(i, files[i], nocache, cb);
    }
}

function onFilterChange()
{
    if (tfilter.get() == "nearest") cgl_filter = CGL.Texture.FILTER_NEAREST;
    if (tfilter.get() == "linear") cgl_filter = CGL.Texture.FILTER_LINEAR;
    if (tfilter.get() == "mipmap") cgl_filter = CGL.Texture.FILTER_MIPMAP;

    reload();
}

function onWrapChange()
{
    if (wrap.get() == "repeat") cgl_wrap = CGL.Texture.WRAP_REPEAT;
    if (wrap.get() == "mirrored repeat") cgl_wrap = CGL.Texture.WRAP_MIRRORED_REPEAT;
    if (wrap.get() == "clamp to edge") cgl_wrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;

    reload();
}

op.onFileChanged = function (fn)
{
    // should reload changed files that are used in the array
};


};

Ops.Gl.TextureArrayLoaderFromArray_v2.prototype = new CABLES.Op();
CABLES.OPS["f994015c-72ab-42f4-9ef7-a6409a9efb9b"]={f:Ops.Gl.TextureArrayLoaderFromArray_v2,objName:"Ops.Gl.TextureArrayLoaderFromArray_v2"};




// **************************************************************
// 
// Ops.Gl.Textures.TextureToBase64_v3
// 
// **************************************************************

Ops.Gl.Textures.TextureToBase64_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inTex = op.inTexture("Texture"),
    start = op.inTriggerButton("Trigger"),
    jpeg = op.inBool("Use JPEG", false),
    dataUrl = op.inBool("Output dataUrl", false),
    outString = op.outString("Base64 string"),
    outLoading = op.outBoolNum("Loading");

const cgl = op.patch.cgl;
const gl = op.patch.cgl.gl;
let fb = null;
outString.ignoreValueSerialize = true;

const canvas = document.createElement("canvas");

let pixelReader = new CGL.PixelReader();

jpeg.onChange =
    dataUrl.onChange =
    start.onTriggered = update;

function update()
{
    op.uiAttr({ "error": null });
    if (!inTex.get() || !inTex.get().tex) return;
    outLoading.set(true);

    const width = inTex.get().width;
    const height = inTex.get().height;

    if (!fb)fb = gl.createFramebuffer();

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, inTex.get().tex, 0);

    const canRead = (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    if (!canRead)
    {
        outLoading.set(true);
        op.uiAttr({ "error": "cannot read texture!" });
        return;
    }

    pixelReader.read(cgl, fb, inTex.get().textureType, 0, 0, width, height,
        (pixel) =>
        {
            // gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            // const data = new Uint8Array(width * height * 4);
            // gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
            // gl.bindFramebuffer(gl.FRAMEBUFFER, null);

            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext("2d");

            // Copy the pixels to a 2D canvas
            const imageData = context.createImageData(width, height);
            imageData.data.set(pixel);

            const data2 = imageData.data;

            // flip image
            Array.from({ "length": height }, (val, i) => { return data2.slice(i * width * 4, (i + 1) * width * 4); })
                .forEach((val, i) => { return data2.set(val, (height - i - 1) * width * 4); });

            context.putImageData(imageData, 0, 0);
            let dataString = "";
            if (jpeg.get())
            {
                dataString = canvas.toDataURL("image/jpeg", 1.0);
            }
            else
            {
                dataString = canvas.toDataURL();
            }
            if (!dataUrl.get())
            {
                dataString = dataString.split(",", 2)[1];
            }
            outString.set(dataString);
            outLoading.set(false);
        });
}

function dataURIToBlob(dataURI, callback)
{
    const binStr = atob(dataURI.split(",")[1]),
        len = binStr.length,
        arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) arr[i] = binStr.charCodeAt(i);
    callback(new Blob([arr], { "type": "image/png" }));
}


};

Ops.Gl.Textures.TextureToBase64_v3.prototype = new CABLES.Op();
CABLES.OPS["0b1732f8-553d-4a71-9f44-be7a71d33207"]={f:Ops.Gl.Textures.TextureToBase64_v3,objName:"Ops.Gl.Textures.TextureToBase64_v3"};




// **************************************************************
// 
// Ops.Gl.Textures.Base64ToTexture
// 
// **************************************************************

Ops.Gl.Textures.Base64ToTexture = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    dataIn = op.inStringEditor("Base64 / Data URI", ""),
    tfilter = op.inSwitch("filter", ["nearest", "linear", "mipmap"], "linear"),
    twrap = op.inValueSelect("wrap", ["clamp to edge", "repeat", "mirrored repeat"], "clamp to edge"),
    textureOut = op.outTexture("Texture"),
    loadingOut = op.outBool("Loading");

const image = new Image();

let doUpdateTex = false;
let selectedWrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;
let selectedFilter = CGL.Texture.FILTER_LINEAR;

function createTex()
{
    const tex = CGL.Texture.createFromImage(op.patch.cgl, image,
        {
            "filter": selectedFilter,
            "wrap": selectedWrap
        });
    textureOut.set(tex);
    loadingOut.set(false);
}

image.onload = function (e)
{
    op.patch.cgl.addNextFrameOnceCallback(createTex.bind(this));
};

dataIn.onChange = () =>
{
    updateTex();
};

twrap.onChange =
    tfilter.onChange = () =>
    {
        if (tfilter.get() == "nearest") selectedFilter = CGL.Texture.FILTER_NEAREST;
        else if (tfilter.get() == "linear") selectedFilter = CGL.Texture.FILTER_LINEAR;
        else if (tfilter.get() == "mipmap") selectedFilter = CGL.Texture.FILTER_MIPMAP;

        if (twrap.get() == "repeat") selectedWrap = CGL.Texture.WRAP_REPEAT;
        else if (twrap.get() == "mirrored repeat") selectedWrap = CGL.Texture.WRAP_MIRRORED_REPEAT;
        else if (twrap.get() == "clamp to edge") selectedWrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;

        updateTex();
    };

function updateTex()
{
    loadingOut.set(true);
    let data = dataIn.get();
    if (data && !data.startsWith("data:"))
    {
        data = "data:;base64," + data;
    }
    image.src = data;
}


};

Ops.Gl.Textures.Base64ToTexture.prototype = new CABLES.Op();
CABLES.OPS["cd07e587-432a-4a81-a2b7-51273cf32171"]={f:Ops.Gl.Textures.Base64ToTexture,objName:"Ops.Gl.Textures.Base64ToTexture"};




// **************************************************************
// 
// Ops.Trigger.TriggerOnChangeTexture
// 
// **************************************************************

Ops.Trigger.TriggerOnChangeTexture = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inval = op.inTexture("Texture"),
    inFilter = op.inBool("Ignore empty/default Texture", false),
    next = op.outTrigger("Changed"),
    outTex = op.outTexture("Result", CGL.Texture.getEmptyTexture(op.patch.cgl));

inval.onLinkChanged =
inval.onChange = function ()
{
    const v = inval.get();
    if (inFilter.get() && (v == CGL.Texture.getEmptyTexture(op.patch.cgl) || v == null)) return;

    outTex.set(v || CGL.Texture.getEmptyTexture(op.patch.cgl));
    next.trigger();
};


};

Ops.Trigger.TriggerOnChangeTexture.prototype = new CABLES.Op();
CABLES.OPS["d7260ecb-d862-496a-8a26-f8165ab49dd2"]={f:Ops.Trigger.TriggerOnChangeTexture,objName:"Ops.Trigger.TriggerOnChangeTexture"};




// **************************************************************
// 
// Ops.User.futuretense.CEM_OpenCV_Canny
// 
// **************************************************************

Ops.User.futuretense.CEM_OpenCV_Canny = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};



// // Create a input port of the type Trigger
const inExecute  = op.inTriggerButton("Trigger In",{"display": "button"});
inExecute.onTriggered = update;

// Create a input port of the type String
const inString  = op.inString("Base64 Image String in");
inString.onChange = update;

// Create a input port of the type value
const inInteger = op.inInt("Canny Threshold in", 50);

// Create a output port of the type String
const outString = op.outString("Base64 String out");




function createImgElement(imgId, src) {
  return new Promise((resolve, reject) => {
    let existingImg = document.getElementById(imgId);

    if (!existingImg) {
      existingImg = new Image();
      existingImg.style.display = 'none';
      existingImg.id = imgId;
      document.body.appendChild(existingImg);
    }

    existingImg.onload = () => {
      resolve(existingImg);
    };

    existingImg.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    existingImg.src = src;
  });
}

function createHiddenCanvas(canvasId, width, height) {
  let existingCanvas = document.getElementById(canvasId);

  if (!existingCanvas) {
    existingCanvas = document.createElement('canvas');
    existingCanvas.style.display = 'none';
    existingCanvas.id = canvasId;
    document.body.appendChild(existingCanvas);
  }

  existingCanvas.width = width;
  existingCanvas.height = height;

  //const context = existingCanvas.getContext('2d');

  return existingCanvas;
}



// this function runs every time the input port is triggered
function update()
{
    if (!inString) return;

    // TODO check validity
    let base64 = inString.get();

    let imgElID = 'hidden-img'
    let canvasElID = 'hidden-canvas'

    let canvas = createHiddenCanvas(canvasElID, 50, 50)

    createImgElement(imgElID, inString.get())
    .then(el => {
        let src = cv.imread(imgElID);
        let dst = new cv.Mat();

        cv.cvtColor(src, src, cv.COLOR_RGB2GRAY, 0);
        let cannyThreshold = inInteger.get()
        cv.Canny(src, dst, cannyThreshold, 3*cannyThreshold, 3, false);

        cv.imshow(canvasElID, dst);

        src.delete();
        dst.delete();

        return canvas.toDataURL('image/png')
    })
    .then(b => {
        outString.set(b)
    })




    // send a trigger out of the output port
    //outTrigger.trigger();
}




















};

Ops.User.futuretense.CEM_OpenCV_Canny.prototype = new CABLES.Op();
CABLES.OPS["8f9b5cc1-1915-4f99-aff1-4fcfd579adf6"]={f:Ops.User.futuretense.CEM_OpenCV_Canny,objName:"Ops.User.futuretense.CEM_OpenCV_Canny"};




// **************************************************************
// 
// Ops.Trigger.TriggerOnChangeString
// 
// **************************************************************

Ops.Trigger.TriggerOnChangeString = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inval = op.inString("String"),
    next = op.outTrigger("Changed"),
    outStr = op.outString("Result");

inval.onChange = function ()
{
    outStr.set(inval.get());
    next.trigger();
};


};

Ops.Trigger.TriggerOnChangeString.prototype = new CABLES.Op();
CABLES.OPS["319d07e0-5cbe-4bc1-89fb-a934fd41b0c4"]={f:Ops.Trigger.TriggerOnChangeString,objName:"Ops.Trigger.TriggerOnChangeString"};




// **************************************************************
// 
// Ops.Trigger.TriggerSend
// 
// **************************************************************

Ops.Trigger.TriggerSend = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const trigger = op.inTriggerButton("Trigger");
op.varName = op.inValueSelect("Named Trigger", [], "", true);

op.varName.onChange = updateName;

trigger.onTriggered = doTrigger;

op.patch.addEventListener("namedTriggersChanged", updateVarNamesDropdown);

updateVarNamesDropdown();

function updateVarNamesDropdown()
{
    if (CABLES.UI)
    {
        const varnames = [];
        const vars = op.patch.namedTriggers;
        varnames.push("+ create new one");
        for (const i in vars) varnames.push(i);
        op.varName.uiAttribs.values = varnames;
    }
}

function updateName()
{
    if (CABLES.UI)
    {
        if (op.varName.get() == "+ create new one")
        {
            new CABLES.UI.ModalDialog({
                "prompt": true,
                "title": "New Trigger",
                "text": "Enter a name for the new trigger",
                "promptValue": "",
                "promptOk": (str) =>
                {
                    op.varName.set(str);
                    op.patch.namedTriggers[str] = op.patch.namedTriggers[str] || [];
                    updateVarNamesDropdown();
                }
            });
            return;
        }

        op.refreshParams();
    }

    if (!op.patch.namedTriggers[op.varName.get()])
    {
        op.patch.namedTriggers[op.varName.get()] = op.patch.namedTriggers[op.varName.get()] || [];
        op.patch.emitEvent("namedTriggersChanged");
    }

    op.setTitle(">" + op.varName.get());

    op.refreshParams();
    op.patch.emitEvent("opTriggerNameChanged", op, op.varName.get());
}

function doTrigger()
{
    const arr = op.patch.namedTriggers[op.varName.get()];
    // fire an event even if noone is receiving this trigger
    // this way TriggerReceiveFilter can still handle it
    op.patch.emitEvent("namedTriggerSent", op.varName.get());

    if (!arr)
    {
        op.setUiError("unknowntrigger", "unknown trigger");
        return;
    }
    else op.setUiError("unknowntrigger", null);

    for (let i = 0; i < arr.length; i++)
    {
        arr[i]();
    }
}


};

Ops.Trigger.TriggerSend.prototype = new CABLES.Op();
CABLES.OPS["ce1eaf2b-943b-4dc0-ab5e-ee11b63c9ed0"]={f:Ops.Trigger.TriggerSend,objName:"Ops.Trigger.TriggerSend"};




// **************************************************************
// 
// Ops.Trigger.TriggerOnce
// 
// **************************************************************

Ops.Trigger.TriggerOnce = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe = op.inTriggerButton("Exec"),
    reset = op.inTriggerButton("Reset"),
    next = op.outTrigger("Next"),
    outTriggered = op.outBoolNum("Was Triggered");

let triggered = false;

op.toWorkPortsNeedToBeLinked(exe);

reset.onTriggered = function ()
{
    triggered = false;
    outTriggered.set(triggered);
};

exe.onTriggered = function ()
{
    if (triggered) return;

    triggered = true;
    next.trigger();
    outTriggered.set(triggered);
};


};

Ops.Trigger.TriggerOnce.prototype = new CABLES.Op();
CABLES.OPS["cf3544e4-e392-432b-89fd-fcfb5c974388"]={f:Ops.Trigger.TriggerOnce,objName:"Ops.Trigger.TriggerOnce"};




// **************************************************************
// 
// Ops.Math.TriggerRandomNumber_v2
// 
// **************************************************************

Ops.Math.TriggerRandomNumber_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe = op.inTriggerButton("Generate"),
    min = op.inValue("min", 0),
    max = op.inValue("max", 1),
    outTrig = op.outTrigger("next"),
    result = op.outNumber("result"),
    inInteger = op.inValueBool("Integer", false),
    noDupe = op.inValueBool("No consecutive duplicates", false);

op.setPortGroup("Value Range", [min, max]);

exe.onTriggered =
    max.onChange =
    min.onChange =
    inInteger.onChange = genRandom;

genRandom();

function genRandom()
{
    let r = (Math.random() * (max.get() - min.get())) + min.get();

    if (inInteger.get())r = randInt();

    if (min.get() != max.get() && max.get() > min.get())
        while (noDupe.get() && r == result.get()) r = randInt();

    result.set(r);
    outTrig.trigger();
}

function randInt()
{
    return Math.floor((Math.random() * ((max.get() - min.get() + 1))) + min.get());
}


};

Ops.Math.TriggerRandomNumber_v2.prototype = new CABLES.Op();
CABLES.OPS["26f446cc-9107-4164-8209-5254487fa132"]={f:Ops.Math.TriggerRandomNumber_v2,objName:"Ops.Math.TriggerRandomNumber_v2"};




// **************************************************************
// 
// Ops.Array.ArrayGetTexture
// 
// **************************************************************

Ops.Array.ArrayGetTexture = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    array = op.inArray("array"),
    index = op.inValueInt("index"),
    value = op.outTexture("value");

let last = null;

array.ignoreValueSerialize = true;
value.ignoreValueSerialize = true;

index.onChange = update;
array.onChange = update;

op.toWorkPortsNeedToBeLinked(array, value);

const emptyTex = CGL.Texture.getEmptyTexture(op.patch.cgl);

function update()
{
    if (index.get() < 0)
    {
        value.set(emptyTex);
        return;
    }

    let arr = array.get();
    if (!arr)
    {
        value.set(emptyTex);
        return;
    }

    let ind = index.get();
    if (ind >= arr.length)
    {
        value.set(emptyTex);
        return;
    }
    if (arr[ind])
    {
        value.set(emptyTex);
        value.set(arr[ind]);
        last = arr[ind];
    }
}


};

Ops.Array.ArrayGetTexture.prototype = new CABLES.Op();
CABLES.OPS["afea522b-ab72-4574-b721-5d37f5abaf77"]={f:Ops.Array.ArrayGetTexture,objName:"Ops.Array.ArrayGetTexture"};




// **************************************************************
// 
// Ops.Array.TextureBufferArray
// 
// **************************************************************

Ops.Array.TextureBufferArray = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const inExec = op.inTrigger("Write");

const inTexture = op.inTexture("Texture");
const inNum = op.inValueInt("Num", 8);

const outArr = op.outArray("Result");

const inSort = op.inValueBool("Order");
const inClear = op.inValueBool("Clear", true);

const cgl = op.patch.cgl;
const frameBuf = cgl.gl.createFramebuffer();
const renderbuffer = cgl.gl.createRenderbuffer();
let index = 0;
const textures = [];
let quadMesh = null;
let inited = false;
const sorted = [];

inNum.onChange = init;

const bgFrag = ""
    .endl() + "UNI float a;"
    .endl() + "UNI sampler2D tex;"
    .endl() + "IN vec2 texCoord;"
    .endl() + "void main()"
    .endl() + "{"
    .endl() + "   vec4 col=texture2D(tex,texCoord);"
    .endl() + "   outColor= col;"
    .endl() + "}";
const bgShader = new CGL.Shader(cgl, "imgcompose bg");
bgShader.setSource(bgShader.getDefaultVertexShader(), bgFrag);
const textureUniform = new CGL.Uniform(bgShader, "t", "tex", 0);

inExec.onTriggered = render;

function init()
{
    if (inNum.get() == 0) return;
    for (let i = 0; i < textures.length; i++)
    {
        textures[i].delete();
    }

    if (!inTexture.get()) return;
    textures.length = inNum.get();
    sorted.length = inNum.get();

    // op.log(inTexture.get());

    for (let i = 0; i < inNum.get(); i++)
    {
        textures[i] = inTexture.get().clone();
        // textures[i].updateMipMap();
    }

    // cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, null);

    // cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, frameBuf);
    cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, frameBuf);
    cgl.gl.framebufferTexture2D(cgl.gl.FRAMEBUFFER, cgl.gl.COLOR_ATTACHMENT0, cgl.gl.TEXTURE_2D, textures[0].tex, 0);

    // cgl.gl.bindRenderbuffer(cgl.gl.RENDERBUFFER, renderbuffer);

    // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, null);
    // cgl.gl.bindRenderbuffer(cgl.gl.RENDERBUFFER, null);
    cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, null);

    // textures[0].updateMipMap();

    inited = true;
}

function createMesh()
{
    const geom = new CGL.Geometry("textureEffect rect");

    geom.vertices = [
        1.0, 1.0, 0.0,
        -1.0, 1.0, 0.0,
        1.0, -1.0, 0.0,
        -1.0, -1.0, 0.0
    ];

    geom.texCoords = [
        1.0, 1.0,
        0.0, 1.0,
        1.0, 0.0,
        0.0, 0.0
    ];

    geom.verticesIndices = [
        0, 1, 2,
        2, 1, 3
    ];

    quadMesh = new CGL.Mesh(cgl, geom);
}

function render()
{
    if (!inTexture.get())
    {
        op.log("no tex 1");
        return;
    }

    if (!inTexture.get().tex)
    {
        op.log("no tex 2");
        return;
    }

    if (!quadMesh)createMesh();
    if (!inited || !frameBuf)init();
    if (!textures[0] || textures.length == 0)
    {
        op.log("no tex");
        return;
    }

    if (!textures[0].compareSettings(inTexture.get()))init();
    // if(inTexture.get().width!=textures[0].width)init();
    // if(inTexture.get().height!=textures[0].height)init();

    index %= inNum.get();

    cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, frameBuf);
    cgl.gl.framebufferTexture2D(cgl.gl.FRAMEBUFFER, cgl.gl.COLOR_ATTACHMENT0, cgl.gl.TEXTURE_2D, textures[index].tex, 0);
    cgl.pushGlFrameBuffer(frameBuf);

    cgl.pushDepthTest(false);

    if (inClear.get())
    {
        cgl.gl.clearColor(0, 0, 0, 1);
        cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
    }

    cgl.pushModelMatrix();

    cgl.pushPMatrix();
    cgl.gl.viewport(0, 0, inTexture.get().width, inTexture.get().height);
    mat4.perspective(cgl.pMatrix, 45, inTexture.get().width / inTexture.get().height, 0.1, 1100.0);

    cgl.pushPMatrix();
    mat4.identity(cgl.pMatrix);

    cgl.pushViewMatrix();
    mat4.identity(cgl.vMatrix);

    cgl.pushModelMatrix();
    mat4.identity(cgl.mMatrix);

    // here be rendering

    cgl.pushShader(bgShader);
    // cgl.currentTextureEffect.bind();

    cgl.setTexture(0, inTexture.get().tex);
    // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D,  );

    quadMesh.render(cgl.getShader());

    cgl.gl.bindFramebuffer(cgl.gl.FRAMEBUFFER, cgl.popGlFrameBuffer());

    cgl.popShader();

    cgl.popDepthTest();
    cgl.popModelMatrix();

    cgl.popPMatrix();
    cgl.popModelMatrix();
    cgl.popViewMatrix();

    cgl.popPMatrix();
    cgl.resetViewPort();

    op.patch.cgl.gl.bindTexture(op.patch.cgl.gl.TEXTURE_2D, textures[index].tex);
    // this._colorTextures[i].updateMipMap();
    textures[index].updateMipMap();
    op.patch.cgl.gl.bindTexture(op.patch.cgl.gl.TEXTURE_2D, null);

    if (inSort.get())
    {
        for (let i = 0; i < textures.length; i++)
        {
            sorted[textures.length - i - 1] = textures[(index + i + 1) % inNum.get()];
        }

        outArr.set(null);
        outArr.set(sorted);
    }
    else
    {
        outArr.set(null);
        outArr.set(textures);
    }
    index++;
}


};

Ops.Array.TextureBufferArray.prototype = new CABLES.Op();
CABLES.OPS["04dc13d2-e339-4e1d-82c5-9c9ff1b175b8"]={f:Ops.Array.TextureBufferArray,objName:"Ops.Array.TextureBufferArray"};




// **************************************************************
// 
// Ops.Time.DelayedTrigger
// 
// **************************************************************

Ops.Time.DelayedTrigger = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe = op.inTrigger("exe"),
    delay = op.inValueFloat("delay", 1),
    cancel = op.inTriggerButton("Cancel"),
    next = op.outTrigger("next"),
    outDelaying = op.outBool("Delaying");

let lastTimeout = null;

cancel.onTriggered = function ()
{
    if (lastTimeout)clearTimeout(lastTimeout);
    lastTimeout = null;
};

exe.onTriggered = function ()
{
    outDelaying.set(true);
    if (lastTimeout)clearTimeout(lastTimeout);

    lastTimeout = setTimeout(
        function ()
        {
            outDelaying.set(false);
            lastTimeout = null;
            next.trigger();
        },
        delay.get() * 1000);
};


};

Ops.Time.DelayedTrigger.prototype = new CABLES.Op();
CABLES.OPS["f4ff66b0-8500-46f7-9117-832aea0c2750"]={f:Ops.Time.DelayedTrigger,objName:"Ops.Time.DelayedTrigger"};




// **************************************************************
// 
// Ops.Vars.VarSetTexture_v2
// 
// **************************************************************

Ops.Vars.VarSetTexture_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const val = op.inTexture("Value", null);
op.varName = op.inDropDown("Variable", [], "", true);

new CABLES.VarSetOpWrapper(op, "object", val, op.varName);


};

Ops.Vars.VarSetTexture_v2.prototype = new CABLES.Op();
CABLES.OPS["4fbfc71e-1429-439f-8591-ad35961252ed"]={f:Ops.Vars.VarSetTexture_v2,objName:"Ops.Vars.VarSetTexture_v2"};




// **************************************************************
// 
// Ops.String.NumberToString_v2
// 
// **************************************************************

Ops.String.NumberToString_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    val = op.inValue("Number"),
    result = op.outString("Result");

val.onChange = update;
update();

function update()
{
    result.set(String(val.get() || 0));
}


};

Ops.String.NumberToString_v2.prototype = new CABLES.Op();
CABLES.OPS["5c6d375a-82db-4366-8013-93f56b4061a9"]={f:Ops.String.NumberToString_v2,objName:"Ops.String.NumberToString_v2"};




// **************************************************************
// 
// Ops.Json.ObjectGetObject_v2
// 
// **************************************************************

Ops.Json.ObjectGetObject_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    data = op.inObject("Object"),
    key = op.inString("Key"),
    result = op.outObject("Result");

result.ignoreValueSerialize = true;
data.ignoreValueSerialize = true;

op.setUiAttrib({ "extendTitlePort": key.name });

key.onChange =
data.onChange = update;

function update()
{
    if (data.get())
    {
        result.setRef(data.get()[key.get()]);
    }
    else
    {
        result.set(null);
    }
}


};

Ops.Json.ObjectGetObject_v2.prototype = new CABLES.Op();
CABLES.OPS["d1dfa305-89db-4ca1-b0ac-2d6321d76ae8"]={f:Ops.Json.ObjectGetObject_v2,objName:"Ops.Json.ObjectGetObject_v2"};




// **************************************************************
// 
// Ops.Json.ObjectGetString
// 
// **************************************************************

Ops.Json.ObjectGetString = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    data = op.inObject("data"),
    key = op.inString("Key"),
    result = op.outString("Result");

result.ignoreValueSerialize = true;
data.ignoreValueSerialize = true;

op.setUiAttrib({ "extendTitlePort": key.name });

key.onChange =
data.onChange = exec;

function exec()
{
    if (data.get())
    {
        result.set(data.get()[key.get()]);
    }
    else
    {
        result.set(null);
    }
}


};

Ops.Json.ObjectGetString.prototype = new CABLES.Op();
CABLES.OPS["7d86cd28-f7d8-44a1-a4da-466c4782aaec"]={f:Ops.Json.ObjectGetString,objName:"Ops.Json.ObjectGetString"};




// **************************************************************
// 
// Ops.Cables.AssetPathURL
// 
// **************************************************************

Ops.Cables.AssetPathURL = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    fn = op.inString("Filename", ""),
    path = op.outString("Path");

fn.onChange = update;

update();

function update()
{
    let filename = fn.get();

    if (!fn.get())
    {
        path.set("");
        return;
    }

    let patchId = null;
    if (op.storage && op.storage.blueprint && op.storage.blueprint.patchId)
    {
        patchId = op.storage.blueprint.patchId;
    }
    filename = op.patch.getAssetPath(patchId) + filename;
    let url = op.patch.getFilePath(filename);
    path.set(url);
}


};

Ops.Cables.AssetPathURL.prototype = new CABLES.Op();
CABLES.OPS["e502ae39-c87e-4516-9e78-cb71333bcfff"]={f:Ops.Cables.AssetPathURL,objName:"Ops.Cables.AssetPathURL"};




// **************************************************************
// 
// Ops.Gl.Texture_v2
// 
// **************************************************************

Ops.Gl.Texture_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    filename = op.inUrl("File", [".jpg", ".png", ".webp", ".jpeg", ".avif"]),
    tfilter = op.inSwitch("Filter", ["nearest", "linear", "mipmap"]),
    wrap = op.inValueSelect("Wrap", ["repeat", "mirrored repeat", "clamp to edge"], "clamp to edge"),
    aniso = op.inSwitch("Anisotropic", ["0", "1", "2", "4", "8", "16"], "0"),
    flip = op.inValueBool("Flip", false),
    unpackAlpha = op.inValueBool("Pre Multiplied Alpha", false),
    active = op.inValueBool("Active", true),
    inFreeMemory = op.inBool("Save Memory", true),
    textureOut = op.outTexture("Texture"),
    width = op.outNumber("Width"),
    height = op.outNumber("Height"),
    ratio = op.outNumber("Aspect Ratio"),
    loaded = op.outNumber("Loaded", false),
    loading = op.outNumber("Loading", false);

const cgl = op.patch.cgl;

op.toWorkPortsNeedToBeLinked(textureOut);
op.setPortGroup("Size", [width, height]);

let loadedFilename = null;
let loadingId = null;
let tex = null;
let cgl_filter = CGL.Texture.FILTER_MIPMAP;
let cgl_wrap = CGL.Texture.WRAP_REPEAT;
let cgl_aniso = 0;
let timedLoader = 0;

unpackAlpha.setUiAttribs({ "hidePort": true });
unpackAlpha.onChange =
    filename.onChange =
    flip.onChange = reloadSoon;
aniso.onChange = tfilter.onChange = onFilterChange;
wrap.onChange = onWrapChange;

tfilter.set("mipmap");
wrap.set("repeat");

textureOut.set(CGL.Texture.getEmptyTexture(cgl));

active.onChange = function ()
{
    if (active.get())
    {
        if (loadedFilename != filename.get() || !tex) reloadSoon();
        else textureOut.set(tex);
    }
    else
    {
        textureOut.set(CGL.Texture.getEmptyTexture(cgl));
        width.set(CGL.Texture.getEmptyTexture(cgl).width);
        height.set(CGL.Texture.getEmptyTexture(cgl).height);
        if (tex)tex.delete();
        op.setUiAttrib({ "extendTitle": "" });
        tex = null;
    }
};

const setTempTexture = function ()
{
    const t = CGL.Texture.getTempTexture(cgl);
    textureOut.set(t);
};

function reloadSoon(nocache)
{
    clearTimeout(timedLoader);
    timedLoader = setTimeout(function ()
    {
        realReload(nocache);
    }, 30);
}

function realReload(nocache)
{
    if (!active.get()) return;
    // if (filename.get() === null) return;
    if (loadingId)loadingId = cgl.patch.loading.finished(loadingId);
    loadingId = cgl.patch.loading.start("textureOp", filename.get(), op);

    let url = op.patch.getFilePath(String(filename.get()));

    if (nocache)url += "?rnd=" + CABLES.uuid();

    if (String(filename.get()).indexOf("data:") == 0) url = filename.get();

    let needsRefresh = false;
    if (loadedFilename != filename.get()) needsRefresh = true;
    loadedFilename = filename.get();

    if ((filename.get() && filename.get().length > 1))
    {
        loaded.set(false);
        loading.set(true);

        const fileToLoad = filename.get();

        op.setUiAttrib({ "extendTitle": CABLES.basename(url) });
        if (needsRefresh) op.refreshParams();

        cgl.patch.loading.addAssetLoadingTask(() =>
        {
            op.setUiError("urlerror", null);

            CGL.Texture.load(cgl, url,
                function (err, newTex)
                {
                    cgl.checkFrameStarted("texture inittexture");

                    if (filename.get() != fileToLoad)
                    {
                        cgl.patch.loading.finished(loadingId);
                        loadingId = null;
                        return;
                    }

                    if (err)
                    {
                        setTempTexture();
                        op.setUiError("urlerror", "could not load texture: \"" + filename.get() + "\"", 2);
                        cgl.patch.loading.finished(loadingId);
                        loadingId = null;
                        return;
                    }

                    textureOut.set(newTex);

                    width.set(newTex.width);
                    height.set(newTex.height);
                    ratio.set(newTex.width / newTex.height);

                    // if (!newTex.isPowerOfTwo()) op.setUiError("npot", "Texture dimensions not power of two! - Texture filtering will not work in WebGL 1.", 0);
                    // else op.setUiError("npot", null);

                    if (tex)tex.delete();
                    tex = newTex;
                    // textureOut.set(null);
                    textureOut.setRef(tex);

                    loading.set(false);
                    loaded.set(true);

                    if (inFreeMemory.get()) tex.image = null;

                    if (loadingId)
                    {
                        cgl.patch.loading.finished(loadingId);
                        loadingId = null;
                    }
                    // testTexture();
                }, {
                    "anisotropic": cgl_aniso,
                    "wrap": cgl_wrap,
                    "flip": flip.get(),
                    "unpackAlpha": unpackAlpha.get(),
                    "filter": cgl_filter
                });

            // textureOut.set(null);
            // textureOut.set(tex);
        });
    }
    else
    {
        cgl.patch.loading.finished(loadingId);
        loadingId = null;
        setTempTexture();
    }
}

function onFilterChange()
{
    if (tfilter.get() == "nearest") cgl_filter = CGL.Texture.FILTER_NEAREST;
    else if (tfilter.get() == "linear") cgl_filter = CGL.Texture.FILTER_LINEAR;
    else if (tfilter.get() == "mipmap") cgl_filter = CGL.Texture.FILTER_MIPMAP;
    else if (tfilter.get() == "Anisotropic") cgl_filter = CGL.Texture.FILTER_ANISOTROPIC;

    aniso.setUiAttribs({ "greyout": cgl_filter != CGL.Texture.FILTER_MIPMAP });

    cgl_aniso = parseFloat(aniso.get());

    reloadSoon();
}

function onWrapChange()
{
    if (wrap.get() == "repeat") cgl_wrap = CGL.Texture.WRAP_REPEAT;
    if (wrap.get() == "mirrored repeat") cgl_wrap = CGL.Texture.WRAP_MIRRORED_REPEAT;
    if (wrap.get() == "clamp to edge") cgl_wrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;

    reloadSoon();
}

op.onFileChanged = function (fn)
{
    if (filename.get() && filename.get().indexOf(fn) > -1)
    {
        textureOut.set(CGL.Texture.getEmptyTexture(op.patch.cgl));
        textureOut.set(CGL.Texture.getTempTexture(cgl));
        realReload(true);
    }
};

// function testTexture()
// {
//     cgl.setTexture(0, tex.tex);

//     const filter = cgl.gl.getTexParameter(cgl.gl.TEXTURE_2D, cgl.gl.TEXTURE_MIN_FILTER);
//     const wrap = cgl.gl.getTexParameter(cgl.gl.TEXTURE_2D, cgl.gl.TEXTURE_WRAP_S);

//     if (cgl_filter === CGL.Texture.FILTER_MIPMAP && filter != cgl.gl.LINEAR_MIPMAP_LINEAR) console.log("wrong texture filter!", filename.get());
//     if (cgl_filter === CGL.Texture.FILTER_NEAREST && filter != cgl.gl.NEAREST) console.log("wrong texture filter!", filename.get());
//     if (cgl_filter === CGL.Texture.FILTER_LINEAR && filter != cgl.gl.LINEAR) console.log("wrong texture filter!", filename.get());

//     if (cgl_wrap === CGL.Texture.WRAP_REPEAT && wrap != cgl.gl.REPEAT) console.log("wrong texture wrap1!", filename.get());
//     if (cgl_wrap === CGL.Texture.WRAP_MIRRORED_REPEAT && wrap != cgl.gl.MIRRORED_REPEAT) console.log("wrong texture wrap2!", filename.get());
//     if (cgl_wrap === CGL.Texture.WRAP_CLAMP_TO_EDGE && wrap != cgl.gl.CLAMP_TO_EDGE) console.log("wrong texture wrap3!", filename.get());
// }


};

Ops.Gl.Texture_v2.prototype = new CABLES.Op();
CABLES.OPS["790f3702-9833-464e-8e37-6f0f813f7e16"]={f:Ops.Gl.Texture_v2,objName:"Ops.Gl.Texture_v2"};




// **************************************************************
// 
// Ops.Json.ObjectKeys
// 
// **************************************************************

Ops.Json.ObjectKeys = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inObj = op.inObject("Object"),
    outNumKeys = op.outNumber("Num Keys"),
    outKeys = op.outArray("Keys");

inObj.onChange = function ()
{
    let o = inObj.get();
    if (!o)
    {
        outNumKeys.set(0);
        outKeys.set([]);
        return;
    }

    let keys = Object.keys(o);
    outNumKeys.set(keys.length);
    outKeys.set(keys);
};


};

Ops.Json.ObjectKeys.prototype = new CABLES.Op();
CABLES.OPS["83b4d148-8cb3-4a45-8824-957eeaf02e22"]={f:Ops.Json.ObjectKeys,objName:"Ops.Json.ObjectKeys"};




// **************************************************************
// 
// Ops.Boolean.And
// 
// **************************************************************

Ops.Boolean.And = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    bool0 = op.inValueBool("bool 1"),
    bool1 = op.inValueBool("bool 2"),
    result = op.outBoolNum("result");

bool0.onChange =
bool1.onChange = exec;

function exec()
{
    result.set(bool1.get() && bool0.get());
}


};

Ops.Boolean.And.prototype = new CABLES.Op();
CABLES.OPS["c26e6ce0-8047-44bb-9bc8-5a4f911ed8ad"]={f:Ops.Boolean.And,objName:"Ops.Boolean.And"};




// **************************************************************
// 
// Ops.Array.ArrayRandomSelection
// 
// **************************************************************

Ops.Array.ArrayRandomSelection = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const inArray = op.inArray("Array"),
    inNum = op.inValueInt("Elements", 10),
    inSeed = op.inValue("Seed", 1),
    result = op.outArray("Result"),
    outArrayLength = op.outNumber("Array length");

let arr = [];
inSeed.onChange = inArray.onChange = inNum.onChange = update;

function update()
{
    if (Math.floor(inNum.get()) < 0 || !inArray.get())
    {
        result.set(null);
        outArrayLength.set(0);
        return;
    }

    let oldArr = inArray.get();

    arr.length = Math.floor(inNum.get());

    let nums = [];

    for (var i = 0; i < Math.max(arr.length, oldArr.length); i++)
        nums[i] = i % (oldArr.length);

    nums = CABLES.shuffleArray(nums);

    Math.randomSeed = inSeed.get();

    for (var i = 0; i < inNum.get(); i++)
    {
        let index = nums[i];
        arr[i] = oldArr[index];
    }
    result.set(null);
    result.set(arr);
    outArrayLength.set(arr.length);
}


};

Ops.Array.ArrayRandomSelection.prototype = new CABLES.Op();
CABLES.OPS["3dc059c8-bcb3-4d63-b806-ce81215da3b5"]={f:Ops.Array.ArrayRandomSelection,objName:"Ops.Array.ArrayRandomSelection"};




// **************************************************************
// 
// Ops.Array.ArrayLength
// 
// **************************************************************

Ops.Array.ArrayLength = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    array = op.inArray("array"),
    outLength = op.outNumber("length");

outLength.ignoreValueSerialize = true;

function update()
{
    let l = 0;
    if (array.get()) l = array.get().length;
    else l = -1;
    outLength.set(l);
}

array.onChange = update;


};

Ops.Array.ArrayLength.prototype = new CABLES.Op();
CABLES.OPS["ea508405-833d-411a-86b4-1a012c135c8a"]={f:Ops.Array.ArrayLength,objName:"Ops.Array.ArrayLength"};




// **************************************************************
// 
// Ops.Gl.DownloadTexture_v2
// 
// **************************************************************

Ops.Gl.DownloadTexture_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inTex = op.inTexture("Texture"),
    start = op.inTriggerButton("Download"),
    fileName = op.inString("Filename", "screenshot"),
    outFinished = op.outBoolNum("Finished");

const gl = op.patch.cgl.gl;
let fb = null;

start.onTriggered = function ()
{
    if (!inTex.get() || !inTex.get().tex) return;
    outFinished.set(false);

    const width = inTex.get().width;
    const height = inTex.get().height;

    if (inTex.get().textureType == CGL.Texture.TYPE_FLOAT) op.setUiError("fptex", "Texture is more than 8 bit, not possible to create files with high precision");
    else op.setUiError("fptex", null);

    if (!fb)fb = gl.createFramebuffer();

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, inTex.get().tex, 0);

    const canRead = (gl.checkFramebufferStatus(gl.FRAMEBUFFER) == gl.FRAMEBUFFER_COMPLETE);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    if (!canRead)
    {
        outFinished.set(true);
        op.logError("cannot read texture!");
        return;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
    const data = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Create a 2D canvas to store the result
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    // Copy the pixels to a 2D canvas
    const imageData = context.createImageData(width, height);
    imageData.data.set(data);

    const data2 = imageData.data;

    // flip image
    Array.from({ "length": height }, (val, i) => { return data2.slice(i * width * 4, (i + 1) * width * 4); })
        .forEach((val, i) => { return data2.set(val, (height - i - 1) * width * 4); });

    context.putImageData(imageData, 0, 0);

    dataURIToBlob(canvas.toDataURL(),
        function (blob)
        {
            const userAgent = navigator.userAgent || navigator.vendor || window.opera;

            if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream)
            {
                const reader = new FileReader();
                // var out = new Blob([byte], {type: "application/pdf"});
                reader.onload = function (e)
                {
                    window.location.href = reader.result;
                //   window.open(reader.result);
                };
                reader.readAsDataURL(blob);
            }
            else
            {
                const anchor = document.createElement("a");
                anchor.download = fileName.get() + ".png";
                // anchor.target='_blank';
                anchor.href = URL.createObjectURL(blob);
                document.body.appendChild(anchor);
                anchor.click();
            }
            outFinished.set(true);
        });
};

function dataURIToBlob(dataURI, callback)
{
    const binStr = atob(dataURI.split(",")[1]),
        len = binStr.length,
        arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) arr[i] = binStr.charCodeAt(i);
    callback(new Blob([arr], { "type": "image/png" }));
}


};

Ops.Gl.DownloadTexture_v2.prototype = new CABLES.Op();
CABLES.OPS["00d2a6ea-5843-43d0-9428-dbc47c112e6e"]={f:Ops.Gl.DownloadTexture_v2,objName:"Ops.Gl.DownloadTexture_v2"};




// **************************************************************
// 
// Ops.Ui.VizArrayTable
// 
// **************************************************************

Ops.Ui.VizArrayTable = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inArr = op.inArray("Array"),
    inOffset = op.inInt("Start Row", 0);

op.setUiAttrib({ "height": 200, "width": 400, "resizable": true });

function getCellValue(v)
{
    let str = "";

    if (typeof v == "string")
    {
        if (CABLES.UTILS.isNumeric(v)) str = "\"" + v + "\"";
        else str = v;
    }
    else if (CABLES.UTILS.isNumeric(v)) str = String(Math.round(v * 10000) / 10000);
    else if (Array.isArray(v))
    {
        let preview = "...";
        if (v.length == 0) preview = "";
        str = "[" + preview + "] (" + v.length + ")";
    }
    else if (typeof v == "object")
    {
        try
        {
            str = JSON.stringify(v, true, 1);
        }
        catch (e)
        {
            str = "{???}";
        }
    }
    else if (v != v || v === undefined)
    {
        str += String(v);
    }
    else
    {
        str += String(v);
    }

    return str;
}

op.renderVizLayer = (ctx, layer) =>
{
    ctx.fillStyle = "#222";
    ctx.fillRect(layer.x, layer.y, layer.width, layer.height);

    ctx.save();
    ctx.scale(layer.scale, layer.scale);

    ctx.font = "normal 10px sourceCodePro";
    ctx.fillStyle = "#ccc";

    const arr = inArr.get() || [];
    let stride = 1;

    if (inArr.get() === null) op.setUiAttrib({ "extendTitle": "null" });
    else if (inArr.get() === undefined) op.setUiAttrib({ "extendTitle": "undefined" });
    else op.setUiAttrib({ "extendTitle": "length: " + arr.length });

    if (inArr.links.length > 0 && inArr.links[0].getOtherPort(inArr))
        stride = inArr.links[0].getOtherPort(inArr).uiAttribs.stride || 1;

    let lines = Math.floor(layer.height / layer.scale / 10 - 1);
    let padding = 4;
    let offset = inOffset.get() * stride;
    let columnsWidth = [];

    for (let i = 0; i < stride; i++)columnsWidth[i] = 0;

    for (let i = offset; i < offset + lines * stride; i += stride)
    {
        for (let s = 0; s < stride; s++)
        {
            const v = arr[i + s];

            columnsWidth[s] = Math.max(columnsWidth[s], getCellValue(v).length);
        }
    }

    let columsPos = [];
    let addUpPos = 30;
    for (let i = 0; i < stride; i++)
    {
        columsPos[i] = addUpPos;
        addUpPos += (columnsWidth[i] + 1) * 7;
    }

    for (let i = offset; i < offset + lines * stride; i += stride)
    {
        if (i < 0) continue;
        if (i + stride > arr.length) continue;

        ctx.fillStyle = "#666";

        const lineNum = (i) / stride;

        if (lineNum >= 0)
            ctx.fillText(lineNum,
                layer.x / layer.scale + padding,
                layer.y / layer.scale + 10 + (i - offset) / stride * 10 + padding);

        for (let s = 0; s < stride; s++)
        {
            const v = arr[i + s];
            let str = getCellValue(v);

            ctx.fillStyle = "#ccc";

            if (typeof v == "string")
            {
            }
            else if (CABLES.UTILS.isNumeric(v)) str = String(Math.round(v * 10000) / 10000);
            else if (Array.isArray(v))
            {
            }
            else if (typeof v == "object")
            {
            }
            else if (v != v || v === undefined)
            {
                ctx.fillStyle = "#f00";
            }

            ctx.fillText(str,
                layer.x / layer.scale + columsPos[s],
                layer.y / layer.scale + 10 + (i - offset) / stride * 10 + padding);
        }
    }

    if (inArr.get() === null) ctx.fillText("null", layer.x / layer.scale + 10, layer.y / layer.scale + 10 + padding);
    else if (inArr.get() === undefined) ctx.fillText("undefined", layer.x / layer.scale + 10, layer.y / layer.scale + 10 + padding);

    const gradHeight = 30;

    if (layer.scale <= 0) return;
    if (offset > 0)
    {
        const radGrad = ctx.createLinearGradient(0, layer.y / layer.scale + 5, 0, layer.y / layer.scale + gradHeight);
        radGrad.addColorStop(0, "#222");
        radGrad.addColorStop(1, "rgba(34,34,34,0.0)");
        ctx.fillStyle = radGrad;
        ctx.fillRect(layer.x / layer.scale, layer.y / layer.scale, 200000, gradHeight);
    }

    if (offset + lines * stride < arr.length)
    {
        const radGrad = ctx.createLinearGradient(0, layer.y / layer.scale + layer.height / layer.scale - gradHeight + 5, 0, layer.y / layer.scale + layer.height / layer.scale - gradHeight + gradHeight);
        radGrad.addColorStop(1, "#222");
        radGrad.addColorStop(0, "rgba(34,34,34,0.0)");
        ctx.fillStyle = radGrad;
        ctx.fillRect(layer.x / layer.scale, layer.y / layer.scale + layer.height / layer.scale - gradHeight, 200000, gradHeight);
    }

    ctx.restore();
};


};

Ops.Ui.VizArrayTable.prototype = new CABLES.Op();
CABLES.OPS["af2eeaaf-ff86-4bfb-9a27-42f05160a5d8"]={f:Ops.Ui.VizArrayTable,objName:"Ops.Ui.VizArrayTable"};




// **************************************************************
// 
// Ops.Trigger.GateTrigger
// 
// **************************************************************

Ops.Trigger.GateTrigger = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe = op.inTrigger('Execute'),
    passThrough = op.inValueBool('Pass Through',true),
    triggerOut = op.outTrigger('Trigger out');

exe.onTriggered = function()
{
    if(passThrough.get())
        triggerOut.trigger();
}


};

Ops.Trigger.GateTrigger.prototype = new CABLES.Op();
CABLES.OPS["65e8b8a2-ba13-485f-883a-2bcf377989da"]={f:Ops.Trigger.GateTrigger,objName:"Ops.Trigger.GateTrigger"};




// **************************************************************
// 
// Ops.String.StringCompose_v3
// 
// **************************************************************

Ops.String.StringCompose_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    format=op.inString('Format',"hello $a, $b $c und $d"),
    a=op.inString('String A','world'),
    b=op.inString('String B',1),
    c=op.inString('String C',2),
    d=op.inString('String D',3),
    e=op.inString('String E'),
    f=op.inString('String F'),
    result=op.outString("Result");

format.onChange=
    a.onChange=
    b.onChange=
    c.onChange=
    d.onChange=
    e.onChange=
    f.onChange=update;

update();

function update()
{
    var str=format.get()||'';
    if(typeof str!='string')
        str='';

    str = str.replace(/\$a/g, a.get());
    str = str.replace(/\$b/g, b.get());
    str = str.replace(/\$c/g, c.get());
    str = str.replace(/\$d/g, d.get());
    str = str.replace(/\$e/g, e.get());
    str = str.replace(/\$f/g, f.get());

    result.set(str);
}

};

Ops.String.StringCompose_v3.prototype = new CABLES.Op();
CABLES.OPS["6afea9f4-728d-4f3c-9e75-62ddc1448bf0"]={f:Ops.String.StringCompose_v3,objName:"Ops.String.StringCompose_v3"};




// **************************************************************
// 
// Ops.String.StringEquals
// 
// **************************************************************

Ops.String.StringEquals = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    str1 = op.inString("String 1"),
    str2 = op.inString("String 2"),
    result = op.outBoolNum("Result");

str1.onChange =
str2.onChange =
    function ()
    {
        result.set(str1.get() == str2.get());
    };


};

Ops.String.StringEquals.prototype = new CABLES.Op();
CABLES.OPS["ef15195a-760b-4ac5-9630-322b0ba7b722"]={f:Ops.String.StringEquals,objName:"Ops.String.StringEquals"};




// **************************************************************
// 
// Ops.Boolean.TriggerBoolean
// 
// **************************************************************

Ops.Boolean.TriggerBoolean = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inTriggerTrue = op.inTriggerButton("True"),
    inTriggerFalse = op.inTriggerButton("false"),
    outResult = op.outBoolNum("Result");

inTriggerTrue.onTriggered = function ()
{
    outResult.set(true);
};

inTriggerFalse.onTriggered = function ()
{
    outResult.set(false);
};


};

Ops.Boolean.TriggerBoolean.prototype = new CABLES.Op();
CABLES.OPS["31f65abe-9d6c-4ba6-a291-ef2de41d2087"]={f:Ops.Boolean.TriggerBoolean,objName:"Ops.Boolean.TriggerBoolean"};




// **************************************************************
// 
// Ops.Boolean.TriggerChangedTrue
// 
// **************************************************************

Ops.Boolean.TriggerChangedTrue = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
let val = op.inValueBool("Value", false);
let next = op.outTrigger("Next");
let oldVal = 0;

val.onChange = function ()
{
    let newVal = val.get();
    if (!oldVal && newVal)
    {
        oldVal = true;
        next.trigger();
    }
    else
    {
        oldVal = false;
    }
};


};

Ops.Boolean.TriggerChangedTrue.prototype = new CABLES.Op();
CABLES.OPS["385197e1-8b34-4d1c-897f-d1386d99e3b3"]={f:Ops.Boolean.TriggerChangedTrue,objName:"Ops.Boolean.TriggerChangedTrue"};




// **************************************************************
// 
// Ops.Html.CSSProperty_v2
// 
// **************************************************************

Ops.Html.CSSProperty_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inEle = op.inObject("Element"),
    inProperty = op.inString("Property"),
    inValue = op.inFloat("Value"),
    inValueSuffix = op.inString("Value Suffix", "px"),
    outEle = op.outObject("HTML Element");

op.setPortGroup("Element", [inEle]);
op.setPortGroup("Attributes", [inProperty, inValue, inValueSuffix]);

inProperty.onChange = updateProperty;
inValue.onChange = update;
inValueSuffix.onChange = update;
let ele = null;

inEle.onChange = inEle.onLinkChanged = function ()
{
    if (ele && ele.style)
    {
        ele.style[inProperty.get()] = "initial";
    }
    update();
};

function updateProperty()
{
    update();
    op.setUiAttrib({ "extendTitle": inProperty.get() + "" });
}

function update()
{
    ele = inEle.get();
    if (ele && ele.style)
    {
        const str = inValue.get() + inValueSuffix.get();
        try
        {
            if (ele.style[inProperty.get()] != str)
                ele.style[inProperty.get()] = str;
        }
        catch (e)
        {
            op.logError(e);
        }
    }
    else
    {
        setTimeout(update, 50);
    }

    outEle.set(inEle.get());
}


};

Ops.Html.CSSProperty_v2.prototype = new CABLES.Op();
CABLES.OPS["c179aa0e-b558-4130-8c2d-2deab2919a07"]={f:Ops.Html.CSSProperty_v2,objName:"Ops.Html.CSSProperty_v2"};




// **************************************************************
// 
// Ops.Html.ElementFadeInOut
// 
// **************************************************************

Ops.Html.ElementFadeInOut = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"fadeInOut_css":"\n.CABLES_animFadedOut\n{\n    display:none !important;\n    opacity:0;\n}\n\n.CABLES_animFadeOut\n{\n    animation: CABLES_keysFadeOut $LENGTHs normal forwards ease-in-out;\n}\n\n.CABLES_animFadeIn\n{\n    /*display:block;*/\n    animation: CABLES_keysFadeIn $LENGTHs normal forwards ease-in-out;\n}\n\n@keyframes CABLES_keysFadeIn {\n    from { opacity: 0; }\n    to   { opacity: $FULLOPACITY; }\n}\n\n@keyframes CABLES_keysFadeOut {\n    from { opacity: $FULLOPACITY; }\n    to   { opacity: 0; }\n}\n",};
const inEle = op.inObject("HTML Element");
const inVisible = op.inValueBool("Visible", true);
const inDuration = op.inValue("Duration", 0.5);
const inOpacity = op.inValue("Opacity", 1);
const outShowing = op.outBoolNum("Is Showing", false);

let theTimeout = null;
inDuration.onChange = update;
inOpacity.onChange = update;

inVisible.onChange = updateVisibility;
inEle.onChange = updateVisibility;

let styleEle = null;
const eleId = "css_" + CABLES.uuid();

update();

let oldEle = null;
let loaded = true;
const oldvis = null;
loaded = true;

op.onLoaded = function ()
{
    loaded = true;
    updateVisibility();
    outShowing.set(inVisible.get());
};

function updateVisibility()
{
    const ele = inEle.get();

    if (!loaded)
    {
        setTimeout(updateVisibility, 50);
        return;
    }

    if (styleEle && ele)
    {
        // if (ele == oldEle) return;
        // oldEle = ele;
        if (inVisible.get())
        {
            outShowing.set(true);
            if (ele && ele.classList && !ele.classList.contains("CABLES_animFadeIn"))
            {
                clearTimeout(theTimeout);
                ele.classList.remove("CABLES_animFadedOut");
                ele.classList.remove("CABLES_animFadeOut");
                ele.classList.add("CABLES_animFadeIn");
                theTimeout = setTimeout(function ()
                {
                    ele.classList.remove("CABLES_animFadeIn");
                    outShowing.set(true);
                }, inDuration.get() * 1000);
            }
        }
        else
        {
            outShowing.set(true);
            if (ele && ele.classList && !ele.classList.contains("CABLES_animFadeOut"))
            {
                clearTimeout(theTimeout);
                ele.classList.remove("CABLES_animFadeIn");
                ele.classList.add("CABLES_animFadeOut");
                theTimeout = setTimeout(function ()
                {
                    ele.classList.add("CABLES_animFadedOut");
                    outShowing.set(false);
                }, inDuration.get() * 1000);
            }
        }
    }
    else
    {
        // op.logError("no html element");
    }
}

function getCssContent()
{
    let css = attachments.fadeInOut_css;

    while (css.indexOf("$LENGTH") > -1)css = css.replace("$LENGTH", inDuration.get());
    while (css.indexOf("$FULLOPACITY") > -1)css = css.replace("$FULLOPACITY", inOpacity.get());

    return css;
}

function update()
{
    styleEle = document.getElementById(eleId);

    if (styleEle)
    {
        styleEle.textContent = getCssContent();
    }
    else
    {
        styleEle = document.createElement("style");
        styleEle.type = "text/css";
        styleEle.id = eleId;
        styleEle.textContent = getCssContent();

        const head = document.getElementsByTagName("body")[0];
        head.appendChild(styleEle);
    }
}

op.onDelete = function ()
{
    const ele = inEle.get();

    if (ele && ele.classList)
    {
        ele.classList.remove("CABLES_animFadeIn");
        ele.classList.remove("CABLES_animFadedOut");
        ele.classList.remove("CABLES_animFadeOut");
    }

    styleEle = document.getElementById(eleId);
    if (styleEle)styleEle.remove();
};


};

Ops.Html.ElementFadeInOut.prototype = new CABLES.Op();
CABLES.OPS["392e65eb-4ebe-4adb-8711-e4cfe059c6c9"]={f:Ops.Html.ElementFadeInOut,objName:"Ops.Html.ElementFadeInOut"};




// **************************************************************
// 
// Ops.Devices.Mobile.Pinch
// 
// **************************************************************

Ops.Devices.Mobile.Pinch = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
// constants
const elId = "glcanvas";
const initialScale = 1.0;

// inputs
const enabledPort = op.inValueBool("Enabled", true);
const minScalePort = op.inValue("Min Scale", 0.0);
const maxScalePort = op.inValue("Max Scale", 4.0);
const resetScalePort = op.inTriggerButton("Reset Scale");
const inLimit = op.inBool("Limit", true);

// variables
let scale = initialScale;
let tmpScale = initialScale;
let pinchInProgress = false;

// setup
const el = document.getElementById(elId);
const hammertime = new Hammer(el);
hammertime.get("pinch").set({ "enable": true });

// outputs
const scalePort = op.outNumber("Scale", 1);
const eventPort = op.outObject("Event Details");
const outDelta = op.outNumber("Delta");

// change listeners
window.addEventListener("gesturestart", (e) => { return e.preventDefault(); });
window.addEventListener("gesturechange", (e) => { return e.preventDefault(); });
window.addEventListener("gestureend", (e) => { return e.preventDefault(); });

hammertime.on("pinch", function (ev)
{
    op.log(ev.additionalEvent);
    ev.preventDefault(); // this is ignored in some browsers
    if (!enabledPort.get()) { return; }

    // if(ev.isFinal || ev.isFirst) { op.log(ev); }

    tmpScale = ev.scale;
    pinchInProgress = true;

    // if(ev.isFinal || !ev.isFinal && pinchInProgress) {
    const oldScale = scale;
    outDelta.set(0);

    if (ev.isFinal)
    {
        scale *= tmpScale;
        scale = checkAndCorrectBoundaries(scale);

        scalePort.set(scale);
        pinchInProgress = false;
        op.log("Final Pinch detected, resetting");
        tmpScale = initialScale;
    }
    else
    {
        scalePort.set(checkAndCorrectBoundaries(scale * tmpScale));
    }

    let d = oldScale - scalePort.get();
    if (d < 0) d = -1;
    else if (d > 0) d = 1;

    outDelta.set(d);

    // if(ev.additionalEvent) {
	    /*
	    if(ev.additionalEvent === 'pinchin') {
	        scale -=  Math.abs(ev.velocity);
	    } else if (ev.additionalEvent === 'pinchout') {
	        scale += Math.abs(ev.velocity);
	    }
	    */
    // }
    // scale += ev.velocity;
    /*
	op.log('ev.scale: ', ev.scale);
	tmpScale = ev.scale;

	var scaleToSet;
	if(ev.isFinal) {
	    scale *= tmpScale;
	    scaleToSet = scale;
	    tmpScale = initialScale;
	} else {
	    scaleToSet = scale * tmpScale;
	}

	op.log('scaleToSet', scaleToSet);

	scale = checkAndCorrectBoundaries(scale);
	scaleToSet = checkAndCorrectBoundaries(scaleToSet);

	scalePort.set(scaleToSet);
	*/
});

el.addEventListener("touchend", function (ev)
{
    op.log("touchend");
    if (pinchInProgress)
    {
        op.log("touchend, setting manually");
        ev.preventDefault(); // this is ignored in some browsers
        ev.stopPropagation();
        pinchInProgress = false;
        scale *= tmpScale;
        scale = checkAndCorrectBoundaries(scale);
        tmpScale = initialScale;
        scalePort.set(scale);
    }
});

function checkAndCorrectBoundaries(s)
{
    let correctedS = s;

    if (inLimit.get())
    {
        if (s < minScalePort.get())
        {
    	    correctedS = minScalePort.get();
    	}
        else if (s > maxScalePort.get())
        {
    	    correctedS = maxScalePort.get();
    	}
    }
    return correctedS;
}

resetScalePort.onTriggered = reset;

// functions

function reset()
{
    scale = initialScale;
    scalePort.set(scale);
}


};

Ops.Devices.Mobile.Pinch.prototype = new CABLES.Op();
CABLES.OPS["98e19e37-88ca-4c07-bed7-a050dac31e3a"]={f:Ops.Devices.Mobile.Pinch,objName:"Ops.Devices.Mobile.Pinch"};




// **************************************************************
// 
// Ops.Anim.Snap
// 
// **************************************************************

Ops.Anim.Snap = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inVal = op.inValue("Delta"),

    snapVals = op.inArray("Snap at Values"),
    snapDist = op.inValue("Snap Distance"),
    snapDistRelease = op.inValue("Snap Distance Release"),
    inSlow = op.inValue("Slowdown", 0.4),
    inBlock = op.inValue("Block Input after snap"),
    inReset = op.inTriggerButton("Reset"),
    inMin = op.inValue("Min", 0),
    inMax = op.inValue("Max", 0),

    inMul = op.inValue("Value Mul", 1),
    inEnabled = op.inValueBool("Enabled", true),

    outVal = op.outNumber("Result"),
    outDist = op.outNumber("Distance"),
    outSnapped = op.outBoolNum("Snapped"),
    outWasSnapped = op.outBoolNum("was snapped");

inVal.onChange = update;
inVal.changeAlways = true;

let snapped = false;
let val = 0;
let hasError = false;
let timeout = 0;
let blocking = false;
let lastValue = -1;
let snappedArr = [];

snapVals.onChange = checkError;

inReset.onTriggered = function ()
{
    val = 0;
    outVal.set(val);
    // update();
};

function checkError()
{
    let snaps = snapVals.get();
    if (!snaps || snaps.length == 0)
    {
        op.setUiError("snapsnull", "needs array containing snap points");
        hasError = true;
        return;
    }

    if (hasError)
    {
        op.setUiError("snapsnull", null);
        hasError = false;
        setTimeout(update, 500);
    }

    snappedArr = [];
    for (let i = 0; i < snapVals.length; i++)
    {
        snappedArr[i] = false;
    }
}

function update()
{
    if (blocking) return;
    let snaps = snapVals.get();

    let d = 999999999;
    let snapvalue = 0;
    let currentIndex = -1;

    for (let i = 0; i < snaps.length; i++)
    {
        let dd = Math.abs(val - snaps[i]) + 0.01;
        if (dd < d)
        {
            d = dd;
            snapvalue = snaps[i];
            currentIndex = i;
        }

        if (val > snaps[i] && !snappedArr[i])
        {
            val = snaps[i];
            d = 0;
            currentIndex = i;
        }
    }

    if (d === 0) return;
    if (inVal.get() === 0) return;

    if (d < snapDistRelease.get())
    {
        let vv = inVal.get() * Math.abs(((d / snapDistRelease.get()) * inSlow.get())) * inMul.get();
        val += vv;

        clearTimeout(timeout);

        timeout = setTimeout(function ()
        {
            val = snapvalue;
            outVal.set(val);
        }, 250);
    }
    else
    {
        clearTimeout(timeout);
        val += inVal.get();
    }

    if (!inEnabled.get())
    {
        outVal.set(val);
        lastValue = val;
    }

    inVal.set(0);

    d = Math.abs(val - snapvalue);
    outDist.set(d);
    let wassnapped = false;

    if (d > snapDist.get())
    {
        snapped = false;
        wassnapped = false;
    }

    if (!snapped)
    {
        if (d < snapDist.get())
        {
            val = snapvalue;
            if (inBlock.get() > 0)
            {
                blocking = true;
                setTimeout(function ()
                {
                    blocking = false;
                }, inBlock.get() * 1000);
            }
            snappedArr[currentIndex] = true;
            snapped = true;
            wassnapped = true;
        }
        else
        {
            snapped = false;
        }
    }

    outSnapped.set(snapped);
    outWasSnapped.set(wassnapped);

    if (inMax.get() != inMin.get() != 0)
    {
        if (val > inMax.get())val = inMax.get();
        else if (val < inMin.get())val = inMin.get();
    }

    outVal.set(val);
    lastValue = val;
}


};

Ops.Anim.Snap.prototype = new CABLES.Op();
CABLES.OPS["7319d30d-bce2-4e66-8143-e4c0ff5a37a2"]={f:Ops.Anim.Snap,objName:"Ops.Anim.Snap"};




// **************************************************************
// 
// Ops.Array.StringToArray_v2
// 
// **************************************************************

Ops.Array.StringToArray_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const text = op.inStringEditor("text", "1,2,3"),
    separator = op.inString("separator", ","),
    toNumber = op.inValueBool("Numbers", true),
    trim = op.inValueBool("Trim", true),
    splitNewLines = op.inBool("Split Lines", false),
    parsed = op.outTrigger("Parsed"),
    arr = op.outArray("array"),
    len = op.outNumber("length");

text.setUiAttribs({ "ignoreBigPort": true });

text.onChange = separator.onChange = toNumber.onChange = trim.onChange = parse;

splitNewLines.onChange = () =>
{
    separator.setUiAttribs({ "greyout": splitNewLines.get() });
    parse();
};

parse();

function parse()
{
    if (!text.get())
    {
        arr.set(null);
        arr.set([]);
        len.set(0);
        return;
    }

    let textInput = text.get();
    if (trim.get() && textInput)
    {
        textInput = textInput.replace(/^\s+|\s+$/g, "");
        textInput = textInput.trim();
    }

    let r;
    let sep = separator.get();
    if (separator.get() === "\\n") sep = "\n";
    if (splitNewLines.get()) r = textInput.split("\n");
    else r = textInput.split(sep);

    if (r[r.length - 1] === "") r.length -= 1;

    len.set(r.length);

    if (trim.get())
    {
        for (let i = 0; i < r.length; i++)
        {
            r[i] = r[i].replace(/^\s+|\s+$/g, "");
            r[i] = r[i].trim();
        }
    }

    op.setUiError("notnum", null);
    if (toNumber.get())
    {
        let hasStrings = false;
        for (let i = 0; i < r.length; i++)
        {
            r[i] = Number(r[i]);
            if (!CABLES.UTILS.isNumeric(r[i]))
            {
                hasStrings = true;
            }
        }
        if (hasStrings)
        {
            op.setUiError("notnum", "Parse Error / Not all values numerical!");
        }
    }

    // arr.set(null);
    arr.setRef(r);
    parsed.trigger();
}


};

Ops.Array.StringToArray_v2.prototype = new CABLES.Op();
CABLES.OPS["c974de41-4ce4-4432-b94d-724741109c71"]={f:Ops.Array.StringToArray_v2,objName:"Ops.Array.StringToArray_v2"};




// **************************************************************
// 
// Ops.Devices.Mouse.MouseWheel_v2
// 
// **************************************************************

Ops.Devices.Mouse.MouseWheel_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    speed = op.inValue("Speed", 1),
    preventScroll = op.inValueBool("prevent scroll", true),
    flip = op.inValueBool("Flip Direction"),
    inSimpleIncrement = op.inBool("Simple Delta", true),
    area = op.inSwitch("Area", ["Canvas", "Document", "Parent"], "Document"),
    active = op.inValueBool("active", true),
    delta = op.outNumber("delta", 0),
    deltaX = op.outNumber("delta X", 0),
    deltaOrig = op.outNumber("browser event delta", 0),
    trigger = op.outTrigger("Wheel Action");

const cgl = op.patch.cgl;
const value = 0;

const startTime = CABLES.now() / 1000.0;
const v = 0;

let dir = 1;

let listenerElement = null;

area.onChange = updateArea;
const vOut = 0;

addListener();

const isChromium = window.chrome,
    winNav = window.navigator,
    vendorName = winNav.vendor,
    isOpera = winNav.userAgent.indexOf("OPR") > -1,
    isIEedge = winNav.userAgent.indexOf("Edge") > -1,
    isIOSChrome = winNav.userAgent.match("CriOS");

const isWindows = window.navigator.userAgent.indexOf("Windows") != -1;
const isLinux = window.navigator.userAgent.indexOf("Linux") != -1;
const isMac = window.navigator.userAgent.indexOf("Mac") != -1;

const isChrome = (isChromium !== null && isChromium !== undefined && vendorName === "Google Inc." && isOpera === false && isIEedge === false);
const isFirefox = navigator.userAgent.search("Firefox") > 1;

flip.onChange = function ()
{
    if (flip.get())dir = -1;
    else dir = 1;
};

function normalizeWheel(event)
{
    let sY = 0;

    if ("detail" in event) { sY = event.detail; }

    if ("deltaY" in event)
    {
        sY = event.deltaY;
        if (event.deltaY > 20)sY = 20;
        else if (event.deltaY < -20)sY = -20;
    }
    return sY * dir;
}

function normalizeWheelX(event)
{
    let sX = 0;

    if ("deltaX" in event)
    {
        sX = event.deltaX;
        if (event.deltaX > 20)sX = 20;
        else if (event.deltaX < -20)sX = -20;
    }
    return sX;
}

let lastEvent = 0;

function onMouseWheel(e)
{
    if (Date.now() - lastEvent < 10) return;
    lastEvent = Date.now();

    deltaOrig.set(e.wheelDelta || e.deltaY);

    if (e.deltaY)
    {
        let d = normalizeWheel(e);
        if (inSimpleIncrement.get())
        {
            if (d > 0)d = speed.get();
            else d = -speed.get();
        }
        else d *= 0.01 * speed.get();

        delta.set(0);
        delta.set(d);
    }

    if (e.deltaX)
    {
        let dX = normalizeWheelX(e);
        dX *= 0.01 * speed.get();

        deltaX.set(0);
        deltaX.set(dX);
    }

    if (preventScroll.get()) e.preventDefault();
    trigger.trigger();
}

function updateArea()
{
    removeListener();

    if (area.get() == "Document") listenerElement = document;
    if (area.get() == "Parent") listenerElement = cgl.canvas.parentElement;
    else listenerElement = cgl.canvas;

    if (active.get())addListener();
}

function addListener()
{
    if (!listenerElement)updateArea();
    listenerElement.addEventListener("wheel", onMouseWheel, { "passive": false });
}

function removeListener()
{
    if (listenerElement) listenerElement.removeEventListener("wheel", onMouseWheel);
}

active.onChange = function ()
{
    updateArea();
};


};

Ops.Devices.Mouse.MouseWheel_v2.prototype = new CABLES.Op();
CABLES.OPS["7b9626db-536b-4bb4-85c3-95401bc60d1b"]={f:Ops.Devices.Mouse.MouseWheel_v2,objName:"Ops.Devices.Mouse.MouseWheel_v2"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.EdgeDetection_v4
// 
// **************************************************************

Ops.Gl.TextureEffects.EdgeDetection_v4 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"edgedetect_frag":"IN vec2 texCoord;\nUNI sampler2D tex;\nUNI float amount;\nUNI float width;\nUNI float strength;\nUNI float texWidth;\nUNI float texHeight;\nUNI float mulColor;\n\nconst vec4 lumcoeff = vec4(0.299,0.587,0.114, 0.);\n\nvec3 desaturate(vec3 color)\n{\n    return vec3(dot(vec3(0.2126,0.7152,0.0722), color));\n}\n\n{{CGL.BLENDMODES3}}\n\nvoid main()\n{\n    // vec4 col=vec4(1.0,0.0,0.0,1.0);\n\n    // float pixelX=0.27/texWidth;\n    // float pixelY=0.27/texHeight;\n    float pixelX=(width+0.01)*4.0/texWidth;\n    float pixelY=(width+0.01)*4.0/texHeight;\n\nvec2 tc=texCoord;\n// #ifdef OFFSETPIXEL\n    tc.x+=1.0/texWidth*0.5;\n    tc.y+=1.0/texHeight*0.5;\n// #endif\n    // col=texture(tex,texCoord);\n\n    float count=1.0;\n    vec4 base=texture(tex,texCoord);\n\n\tvec4 horizEdge = vec4( 0.0 );\n\thorizEdge -= texture( tex, vec2( tc.x - pixelX, tc.y - pixelY ) ) * 1.0;\n\thorizEdge -= texture( tex, vec2( tc.x - pixelX, tc.y     ) ) * 2.0;\n\thorizEdge -= texture( tex, vec2( tc.x - pixelX, tc.y + pixelY ) ) * 1.0;\n\thorizEdge += texture( tex, vec2( tc.x + pixelX, tc.y - pixelY ) ) * 1.0;\n\thorizEdge += texture( tex, vec2( tc.x + pixelX, tc.y     ) ) * 2.0;\n\thorizEdge += texture( tex, vec2( tc.x + pixelX, tc.y + pixelY ) ) * 1.0;\n\tvec4 vertEdge = vec4( 0.0 );\n\tvertEdge -= texture( tex, vec2( tc.x - pixelX, tc.y - pixelY ) ) * 1.0;\n\tvertEdge -= texture( tex, vec2( tc.x    , tc.y - pixelY ) ) * 2.0;\n\tvertEdge -= texture( tex, vec2( tc.x + pixelX, tc.y - pixelY ) ) * 1.0;\n\tvertEdge += texture( tex, vec2( tc.x - pixelX, tc.y + pixelY ) ) * 1.0;\n\tvertEdge += texture( tex, vec2( tc.x    , tc.y + pixelY ) ) * 2.0;\n\tvertEdge += texture( tex, vec2( tc.x + pixelX, tc.y + pixelY ) ) * 1.0;\n\n\thorizEdge*=base.a;\n\tvertEdge*=base.a;\n\n\n\tvec3 edge = sqrt((horizEdge.rgb/count * horizEdge.rgb/count) + (vertEdge.rgb/count * vertEdge.rgb/count));\n\n    edge=desaturate(edge);\n    edge*=strength;\n\n    if(mulColor>0.0) edge*=texture( tex, texCoord ).rgb*mulColor*4.0;\n    edge=max(min(edge,1.0),0.0);\n\n    //blend section\n    vec4 col=vec4(edge,base.a);\n\n    outColor=cgl_blendPixel(base,col,amount*base.a);\n}\n\n",};
const
    render = op.inTrigger("Render"),
    blendMode = CGL.TextureEffect.AddBlendSelect(op, "Blend Mode", "normal"),
    amount = op.inValueSlider("Amount", 1),
    strength = op.inFloat("Strength", 4.0),
    width = op.inValueSlider("Width", 0.1),
    mulColor = op.inValueSlider("Mul Color", 0),
    trigger = op.outTrigger("Trigger");

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, op.name);

shader.setSource(shader.getDefaultVertexShader(), attachments.edgedetect_frag);

const
    textureUniform = new CGL.Uniform(shader, "t", "tex", 0),
    amountUniform = new CGL.Uniform(shader, "f", "amount", amount),
    strengthUniform = new CGL.Uniform(shader, "f", "strength", strength),
    widthUniform = new CGL.Uniform(shader, "f", "width", width),
    uniWidth = new CGL.Uniform(shader, "f", "texWidth", 128),
    uniHeight = new CGL.Uniform(shader, "f", "texHeight", 128),
    uniMulColor = new CGL.Uniform(shader, "f", "mulColor", mulColor);

CGL.TextureEffect.setupBlending(op, shader, blendMode, amount);

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op,3)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

    uniWidth.setValue(cgl.currentTextureEffect.getCurrentSourceTexture().width);
    uniHeight.setValue(cgl.currentTextureEffect.getCurrentSourceTexture().height);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.TextureEffects.EdgeDetection_v4.prototype = new CABLES.Op();
CABLES.OPS["0240e26e-b86d-43b2-8c72-6795bb86dc76"]={f:Ops.Gl.TextureEffects.EdgeDetection_v4,objName:"Ops.Gl.TextureEffects.EdgeDetection_v4"};




// **************************************************************
// 
// Ops.Ui.Comment_v2
// 
// **************************************************************

Ops.Ui.Comment_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inTitle = op.inString("title", "New comment"),
    inText = op.inTextarea("text");
inTitle.setUiAttribs({ "hidePort": true });
inText.setUiAttribs({ "hidePort": true });

op.init =
    inTitle.onChange =
    inText.onChange =
    op.onLoaded = update;

update();

function update()
{
    if (CABLES.UI)
    {
        op.uiAttr(
            {
                "comment_title": inTitle.get(),
                "comment_text": inText.get()
            });

        op.name = inTitle.get();
    }
}


};

Ops.Ui.Comment_v2.prototype = new CABLES.Op();
CABLES.OPS["93492eeb-bf35-4a62-98f7-d85b0b79bfe5"]={f:Ops.Ui.Comment_v2,objName:"Ops.Ui.Comment_v2"};




// **************************************************************
// 
// Ops.Value.GateNumber
// 
// **************************************************************

Ops.Value.GateNumber = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const valueInPort = op.inValue("Value In", 0);
const passThroughPort = op.inValueBool("Pass Through");
const valueOutPort = op.outNumber("Value Out");

valueInPort.onChange = update;
passThroughPort.onChange = update;

valueInPort.changeAlways = true;
valueOutPort.changeAlways = true;

function update()
{
    if (passThroughPort.get())
    {
        valueOutPort.set(valueInPort.get());
    }
}


};

Ops.Value.GateNumber.prototype = new CABLES.Op();
CABLES.OPS["594105c8-1fdb-4f3c-bbd5-29b9ad6b33e0"]={f:Ops.Value.GateNumber,objName:"Ops.Value.GateNumber"};




// **************************************************************
// 
// Ops.Extension.FxHash.FxHash
// 
// **************************************************************

Ops.Extension.FxHash.FxHash = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
if (!CABLES.fakefxhash && !window.fxhash || CABLES.fakefxhash)
{
    CABLES.fakefxhash = true;
}

const
    isReal = !CABLES.fakefxhash,
    alphabet = "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";

const
    inHash = op.inString("Hash", ""),
    inRandomizeHash = op.inTriggerButton("Randomize Hash"),
    outHash = op.outString("fxhash"),
    outRandom1 = op.outNumber("fxrand 1"),
    outRandom2 = op.outNumber("fxrand 2"),
    outRandom3 = op.outNumber("fxrand 3"),
    outRandom4 = op.outNumber("fxrand 4"),
    outArr = op.outArray("Random Numbers"),
    outEmbedded = op.outBoolNum("fxhash environment", isReal);

inHash.onChange = init;

let inited = false;

init();

inRandomizeHash.onTriggered = () =>
{
    inHash.set(randomHash());
    op.refreshParams();
};

function randomHash()
{
    let str = "";
    const all = alphabet.length - 1;

    for (let i = 0; i < 51; i++)
    {
        str += alphabet[Math.round(Math.random() * all)];
    }
    return str;
}

function init()
{
    if (isReal && inited) return;
    if (!isReal)
    {
        window.fxhash = inHash.get() || randomHash();
        let b58dec = (str) => { return [...str].reduce((p, c) => { return p * alphabet.length + alphabet.indexOf(c) | 0; }, 0); };
        let fxhashTrunc = fxhash.slice(2);
        let regex = new RegExp(".{" + ((fxhash.length / 4) | 0) + "}", "g");
        let hashes = fxhashTrunc.match(regex).map((h) => { return b58dec(h); });

        let sfc32 = (a, b, c, d) =>
        {
            return () =>
            {
                a |= 0; b |= 0; c |= 0; d |= 0;
                let t = (a + b | 0) + d | 0;
                d = d + 1 | 0;
                a = b ^ b >>> 9;
                b = c + (c << 3) | 0;
                c = c << 21 | c >>> 11;
                c = c + t | 0;
                return (t >>> 0) / 4294967296;
            };
        };

        window.fxrand = sfc32(...hashes);
    }

    inited = true;

    outHash.set(window.fxhash);

    outRandom1.set(0);
    outRandom2.set(0);
    outRandom3.set(0);
    outRandom4.set(0);

    outRandom1.set(fxrand());
    outRandom2.set(fxrand());
    outRandom3.set(fxrand());
    outRandom4.set(fxrand());

    const arr = [];
    for (let i = 0; i < 1000; i++)arr.push(fxrand());
    outArr.set(arr);
}


};

Ops.Extension.FxHash.FxHash.prototype = new CABLES.Op();
CABLES.OPS["090355fe-6ad9-457c-8192-9e306a9fe1eb"]={f:Ops.Extension.FxHash.FxHash,objName:"Ops.Extension.FxHash.FxHash"};




// **************************************************************
// 
// Ops.Debug.ConsoleLog
// 
// **************************************************************

Ops.Debug.ConsoleLog = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inNumber=op.inFloat("Number",0),
    inString=op.inString("String","");


inNumber.onChange=function()
{
    console.log(inNumber.get());
};

inString.onChange=function()
{
    console.log(inString.get());
};

};

Ops.Debug.ConsoleLog.prototype = new CABLES.Op();
CABLES.OPS["545e7225-73b0-4d40-923b-4b39940403a8"]={f:Ops.Debug.ConsoleLog,objName:"Ops.Debug.ConsoleLog"};




// **************************************************************
// 
// Ops.Vars.VarGetString
// 
// **************************************************************

Ops.Vars.VarGetString = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
var val=op.outString("Value");
op.varName=op.inValueSelect("Variable",[],"",true);

new CABLES.VarGetOpWrapper(op,"string",op.varName,val);


};

Ops.Vars.VarGetString.prototype = new CABLES.Op();
CABLES.OPS["3ad08cfc-bce6-4175-9746-fef2817a3b12"]={f:Ops.Vars.VarGetString,objName:"Ops.Vars.VarGetString"};




// **************************************************************
// 
// Ops.Vars.VarSetArray_v2
// 
// **************************************************************

Ops.Vars.VarSetArray_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const val = op.inArray("Value", null);
op.varName = op.inDropDown("Variable", [], "", true);

new CABLES.VarSetOpWrapper(op, "array", val, op.varName);


};

Ops.Vars.VarSetArray_v2.prototype = new CABLES.Op();
CABLES.OPS["8088290f-45d4-4312-b4ca-184d34ca4667"]={f:Ops.Vars.VarSetArray_v2,objName:"Ops.Vars.VarSetArray_v2"};




// **************************************************************
// 
// Ops.Math.Floor
// 
// **************************************************************

Ops.Math.Floor = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const number1 = op.inValue("Number");
const result = op.outNumber("Result");
number1.onChange = exec;

function exec()
{
    result.set(Math.floor(number1.get()));
}


};

Ops.Math.Floor.prototype = new CABLES.Op();
CABLES.OPS["0c77617c-b688-4b55-addf-2cbcaabf98af"]={f:Ops.Math.Floor,objName:"Ops.Math.Floor"};




// **************************************************************
// 
// Ops.Vars.VarGetArray_v2
// 
// **************************************************************

Ops.Vars.VarGetArray_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const val = op.outArray("Value");
op.varName = op.inValueSelect("Variable", [], "", true);

new CABLES.VarGetOpWrapper(op, "array", op.varName, val);


};

Ops.Vars.VarGetArray_v2.prototype = new CABLES.Op();
CABLES.OPS["afa79294-aa9c-43bc-a49a-cade000a1de5"]={f:Ops.Vars.VarGetArray_v2,objName:"Ops.Vars.VarGetArray_v2"};




// **************************************************************
// 
// Ops.Array.ArrayGetNumber
// 
// **************************************************************

Ops.Array.ArrayGetNumber = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    array = op.inArray("array"),
    index = op.inValueInt("index"),
    value = op.outNumber("value");

array.ignoreValueSerialize = true;

index.onChange = array.onChange = update;

function update()
{
    if (array.get())
    {
        let input = array.get()[index.get()];
        if (isNaN(input))
        {
            value.set(0);
            return;
        }
        value.set(parseFloat(input));
    }
}


};

Ops.Array.ArrayGetNumber.prototype = new CABLES.Op();
CABLES.OPS["d1189078-70cf-437d-9a37-b2ebe89acdaf"]={f:Ops.Array.ArrayGetNumber,objName:"Ops.Array.ArrayGetNumber"};




// **************************************************************
// 
// Ops.Math.Modulo
// 
// **************************************************************

Ops.Math.Modulo = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    number1 = op.inValueFloat("number1", 1),
    number2 = op.inValueFloat("number2", 2),
    pingpong = op.inValueBool("pingpong"),
    result = op.outNumber("result");

let calculateFunction = calculateModule;

number1.onChange =
number2.onChange = exec;

pingpong.onChange = updatePingPong;

exec();

function exec()
{
    let n2 = number2.get();
    let n1 = number1.get();

    result.set(calculateFunction(n1, n2));
}

function calculateModule(n1, n2)
{
    let re = ((n1 % n2) + n2) % n2;
    if (re != re) re = 0;
    return re;
}

function calculatePingPong(i, n)
{
    let cycle = 2 * n;
    i %= cycle;
    if (i >= n) return cycle - i;
    else return i;
}

function updatePingPong()
{
    if (pingpong.get()) calculateFunction = calculatePingPong;
    else calculateFunction = calculateModule;
}


};

Ops.Math.Modulo.prototype = new CABLES.Op();
CABLES.OPS["ebc13b25-3705-4265-8f06-5f985b6a7bb1"]={f:Ops.Math.Modulo,objName:"Ops.Math.Modulo"};




// **************************************************************
// 
// Ops.String.StringEditor
// 
// **************************************************************

Ops.String.StringEditor = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    v = op.inStringEditor("value", ""),
    syntax = op.inValueSelect("Syntax", ["text", "glsl", "css", "html", "xml", "json", "javascript", "inline-css", "sql"], "text"),
    result = op.outString("Result");

syntax.onChange = updateSyntax;

function updateSyntax()
{
    let s = syntax.get();
    if (s == "javascript")s = "js";
    v.setUiAttribs({ "editorSyntax": s });
}

v.onChange = function ()
{
    result.set(v.get());
};


};

Ops.String.StringEditor.prototype = new CABLES.Op();
CABLES.OPS["6468b7c1-f63e-4db4-b809-4b203d27ead3"]={f:Ops.String.StringEditor,objName:"Ops.String.StringEditor"};




// **************************************************************
// 
// Ops.Array.ArraySumPrevious
// 
// **************************************************************

Ops.Array.ArraySumPrevious = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inArr=op.inArray("Array"),
    inPad=op.inFloat("Padding",0),
    outArr=op.outArray("Result");

const newArr=[];

inPad.onChange=
inArr.onChange=()=>
{
    outArr.set(null);
    let arr=inArr.get();
    if(!arr || arr.length<1)return;

    newArr.length=arr.length;

    newArr[0]=arr[0];

    for(let i=1;i<arr.length;i++)
    {
        newArr[i]=newArr[i-1]+arr[i]+inPad.get();
    }

    outArr.set(newArr);


};

};

Ops.Array.ArraySumPrevious.prototype = new CABLES.Op();
CABLES.OPS["71494407-e618-425f-890b-dcf6c3d46cf1"]={f:Ops.Array.ArraySumPrevious,objName:"Ops.Array.ArraySumPrevious"};




// **************************************************************
// 
// Ops.Array.MapRangeArray
// 
// **************************************************************

Ops.Array.MapRangeArray = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    v = op.inArray("array"),
    old_min = op.inValueFloat("old min"),
    old_max = op.inValueFloat("old max"),
    new_min = op.inValueFloat("new min"),
    new_max = op.inValueFloat("new max"),
    easing = op.inValueSelect("Easing", ["Linear", "Smoothstep", "Smootherstep"], "Linear"),
    result = op.outArray("result");

op.setPortGroup("Input Range", [old_min, old_max]);
op.setPortGroup("Output Range", [new_min, new_max]);

let ease = 0;
let r = 0;

easing.onChange = function ()
{
    if (easing.get() === "Smoothstep")
    {
        ease = 1;
    }
    else if (easing.get() === "Smootherstep")
    {
        ease = 2;
    }
    else
    {
        ease = 0;
    }
    exec();
};

let outArray = Array(1);

function exec()
{
    const inArray = v.get();
    if (!inArray || inArray.length === 0)
    {
        result.set([]);
        return;
    }
    // const outArray = Array(inArray.length);
    outArray.length = inArray.length;
    for (let i = 0; i < inArray.length; i++)
    {
        let x = inArray[i];

        if (x >= Math.max(old_max.get(), old_min.get()))
        {
            outArray[i] = new_max.get();
        }
        else if (x <= Math.min(old_max.get(), old_min.get()))
        {
            outArray[i] = new_min.get();
        }
        else
        {
            const nMin = new_min.get();
            const nMax = new_max.get();
            const oMin = old_min.get();
            const oMax = old_max.get();

            let reverseInput = false;
            const oldMin = Math.min(oMin, oMax);
            const oldMax = Math.max(oMin, oMax);
            if (oldMin !== oMin) reverseInput = true;

            let reverseOutput = false;
            const newMin = Math.min(nMin, nMax);
            const newMax = Math.max(nMin, nMax);
            if (newMin !== nMin) reverseOutput = true;

            let portion = 0;

            if (reverseInput)
            {
                portion = (oldMax - x) * (newMax - newMin) / (oldMax - oldMin);
            }
            else
            {
                portion = (x - oldMin) * (newMax - newMin) / (oldMax - oldMin);
            }

            if (reverseOutput)
            {
                r = newMax - portion;
            }
            else
            {
                r = portion + newMin;
            }

            if (ease === 0)
            {
                outArray[i] = r;
            }
            else if (ease === 1)
            {
                x = Math.max(0, Math.min(1, (r - nMin) / (nMax - nMin)));
                outArray[i] = nMin + x * x * (3 - 2 * x) * (nMax - nMin); // smoothstep
            }
            else if (ease === 2)
            {
                x = Math.max(0, Math.min(1, (r - nMin) / (nMax - nMin)));
                outArray[i] = nMin + x * x * x * (x * (x * 6 - 15) + 10) * (nMax - nMin); // smootherstep
            }
        }
    }
    result.setRef(outArray);
}

v.set(null);
old_min.set(0);
old_max.set(1);
new_min.set(-1);
new_max.set(1);

v.onChange = exec;
old_min.onChange = exec;
old_max.onChange = exec;
new_min.onChange = exec;
new_max.onChange = exec;

result.set(null);

exec();


};

Ops.Array.MapRangeArray.prototype = new CABLES.Op();
CABLES.OPS["20f921bf-adc2-45fb-b387-834af4f5e19b"]={f:Ops.Array.MapRangeArray,objName:"Ops.Array.MapRangeArray"};




// **************************************************************
// 
// Ops.Math.Subtract
// 
// **************************************************************

Ops.Math.Subtract = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    number1 = op.inValue("number1", 1),
    number2 = op.inValue("number2", 1),
    result = op.outNumber("result");

op.setTitle("-");

number1.onChange =
    number2.onChange = exec;
exec();

function exec()
{
    let v = number1.get() - number2.get();
    if (!isNaN(v)) result.set(v);
}


};

Ops.Math.Subtract.prototype = new CABLES.Op();
CABLES.OPS["a4ffe852-d200-4b96-9347-68feb01122ca"]={f:Ops.Math.Subtract,objName:"Ops.Math.Subtract"};




// **************************************************************
// 
// Ops.Array.ArrayIndexBetween
// 
// **************************************************************

Ops.Array.ArrayIndexBetween = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inArr=op.inArray("Array"),
    inNum=op.inFloat("Value",0),
    outIndex=op.outNumber("Index");

inArr.onChange=
    inNum.onChange=update;

function update()
{
    const arr=inArr.get();

    if(!arr)
    {
        outIndex.set(-1);
        return;
    }

    const n=inNum.get();

    if(n<arr[0])return outIndex.set(0);

    for(let i=0;i<arr.length-1;i++)
    {

        if(n>arr[i] && n<arr[i+1])
        {
            outIndex.set(i+1);
            return;
        }
    }

}

};

Ops.Array.ArrayIndexBetween.prototype = new CABLES.Op();
CABLES.OPS["69faf293-140d-4a2c-ab2e-7e5577ab113d"]={f:Ops.Array.ArrayIndexBetween,objName:"Ops.Array.ArrayIndexBetween"};




// **************************************************************
// 
// Ops.Value.ValueChangedTrigger
// 
// **************************************************************

Ops.Value.ValueChangedTrigger = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    val = op.inFloat("Value", 0),
    exe = op.inTrigger("Execute"),
    trigger = op.outTrigger("trigger");

let changed = false;

exe.onTriggered = function ()
{
    if (changed)
    {
        changed = false;
        trigger.trigger();
    }
};

val.onChange = function ()
{
    changed = true;
};


};

Ops.Value.ValueChangedTrigger.prototype = new CABLES.Op();
CABLES.OPS["9f353fcc-da0b-4af8-ae5c-4edd256fc9e3"]={f:Ops.Value.ValueChangedTrigger,objName:"Ops.Value.ValueChangedTrigger"};




// **************************************************************
// 
// Ops.Array.RotateArray
// 
// **************************************************************

Ops.Array.RotateArray = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const inArray = op.inArray("Array in");
const count = op.inValueInt("Rotate amount", 0);
const outArray = op.outArray("ArrayOut");

let newArr = [];
outArray.set(newArr);

count.onChange =
inArray.onChange = function ()
{
    let arr = inArray.get();
    if (!arr) return;

    let rotateIndex = -count.get();

    newArr = rotate(inArray.get(), rotateIndex, 0);
    outArray.set(null);
    outArray.set(newArr);
};

// https://gist.github.com/aubergene/7ecfe624199e68f60258
function rotate(array, n, guard)
{
    let head, tail;
    n = (n === null) || guard ? 1 : n;
    n %= array.length;
    tail = array.slice(n) || [];

    if (!tail || !tail.concat) return [];

    head = array.slice(0, n) || [];
    return tail.concat(head);
}


};

Ops.Array.RotateArray.prototype = new CABLES.Op();
CABLES.OPS["e435d07b-8545-4469-befb-868510adcb76"]={f:Ops.Array.RotateArray,objName:"Ops.Array.RotateArray"};




// **************************************************************
// 
// Ops.Array.ArraySum
// 
// **************************************************************

Ops.Array.ArraySum = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inArray = op.inArray("In"),
    inValue = op.inValue("Value", 1.0),
    outArray = op.outArray("Result");

let newArr = [];
outArray.set(newArr);

inValue.onChange =
inArray.onChange = function ()
{
    let arr = inArray.get();
    if (!arr) return;

    let add = inValue.get();

    if (newArr.length != arr.length)newArr.length = arr.length;

    for (let i = 0; i < arr.length; i++)
    {
        newArr[i] = arr[i] + add;
    }

    outArray.setRef(newArr);
};


};

Ops.Array.ArraySum.prototype = new CABLES.Op();
CABLES.OPS["c6b5bf63-0be8-4eea-acc0-9d32973e665a"]={f:Ops.Array.ArraySum,objName:"Ops.Array.ArraySum"};




// **************************************************************
// 
// Ops.Math.Clamp
// 
// **************************************************************

Ops.Math.Clamp = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    val = op.inValueFloat("val", 0.5),
    min = op.inValueFloat("min", 0),
    max = op.inValueFloat("max", 1),
    ignore = op.inValueBool("ignore outside values"),
    result = op.outNumber("result");

val.onChange = min.onChange = max.onChange = clamp;

function clamp()
{
    if (ignore.get())
    {
        if (val.get() > max.get()) return;
        if (val.get() < min.get()) return;
    }
    result.set(Math.min(Math.max(val.get(), min.get()), max.get()));
}


};

Ops.Math.Clamp.prototype = new CABLES.Op();
CABLES.OPS["cda1a98e-5e16-40bd-9b18-a67e9eaad5a1"]={f:Ops.Math.Clamp,objName:"Ops.Math.Clamp"};




// **************************************************************
// 
// Ops.Math.OneMinus
// 
// **************************************************************

Ops.Math.OneMinus = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inValue = op.inValue("Value"),
    result = op.outNumber("Result");

inValue.onChange = update;
update();

function update()
{
    result.set(1 - inValue.get());
}


};

Ops.Math.OneMinus.prototype = new CABLES.Op();
CABLES.OPS["f34d019d-59ae-40d6-a55d-a7691bbc40e0"]={f:Ops.Math.OneMinus,objName:"Ops.Math.OneMinus"};




// **************************************************************
// 
// Ops.Math.Pow
// 
// **************************************************************

Ops.Math.Pow = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    base = op.inValueFloat("Base"),
    exponent = op.inValueFloat("Exponent"),
    result = op.outNumber("Result");

exponent.set(2);

base.onChange = update;
exponent.onChange = update;

function update()
{
    let r = Math.pow(base.get(), exponent.get());
    if (isNaN(r))r = 0;
    result.set(r);
}


};

Ops.Math.Pow.prototype = new CABLES.Op();
CABLES.OPS["3bb3f98f-27d6-44c4-b4e5-186e10f0809d"]={f:Ops.Math.Pow,objName:"Ops.Math.Pow"};




// **************************************************************
// 
// Ops.Math.Compare.Equals
// 
// **************************************************************

Ops.Math.Compare.Equals = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    number1 = op.inValue("number1", 1),
    number2 = op.inValue("number2", 1),
    result = op.outBoolNum("result");

number1.onChange =
    number2.onChange = exec;
exec();

function exec()
{
    result.set(number1.get() == number2.get());
}


};

Ops.Math.Compare.Equals.prototype = new CABLES.Op();
CABLES.OPS["4dd3cc55-eebc-4187-9d4e-2e053a956fab"]={f:Ops.Math.Compare.Equals,objName:"Ops.Math.Compare.Equals"};




// **************************************************************
// 
// Ops.Anim.Timer_v2
// 
// **************************************************************

Ops.Anim.Timer_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inSpeed = op.inValue("Speed", 1),
    playPause = op.inValueBool("Play", true),
    reset = op.inTriggerButton("Reset"),
    inSyncTimeline = op.inValueBool("Sync to timeline", false),
    outTime = op.outNumber("Time");

op.setPortGroup("Controls", [playPause, reset, inSpeed]);

const timer = new CABLES.Timer();
let lastTime = null;
let time = 0;
let syncTimeline = false;

playPause.onChange = setState;
setState();

function setState()
{
    if (playPause.get())
    {
        timer.play();
        op.patch.addOnAnimFrame(op);
    }
    else
    {
        timer.pause();
        op.patch.removeOnAnimFrame(op);
    }
}

reset.onTriggered = doReset;

function doReset()
{
    time = 0;
    lastTime = null;
    timer.setTime(0);
    outTime.set(0);
}

inSyncTimeline.onChange = function ()
{
    syncTimeline = inSyncTimeline.get();
    playPause.setUiAttribs({ "greyout": syncTimeline });
    reset.setUiAttribs({ "greyout": syncTimeline });
};

op.onAnimFrame = function (tt)
{
    if (timer.isPlaying())
    {
        if (CABLES.overwriteTime !== undefined)
        {
            outTime.set(CABLES.overwriteTime * inSpeed.get());
        }
        else

        if (syncTimeline)
        {
            outTime.set(tt * inSpeed.get());
        }
        else
        {
            timer.update();
            const timerVal = timer.get();

            if (lastTime === null)
            {
                lastTime = timerVal;
                return;
            }

            const t = Math.abs(timerVal - lastTime);
            lastTime = timerVal;

            time += t * inSpeed.get();
            if (time != time)time = 0;
            outTime.set(time);
        }
    }
};


};

Ops.Anim.Timer_v2.prototype = new CABLES.Op();
CABLES.OPS["aac7f721-208f-411a-adb3-79adae2e471a"]={f:Ops.Anim.Timer_v2,objName:"Ops.Anim.Timer_v2"};




// **************************************************************
// 
// Ops.Trigger.TriggerIfDecreased
// 
// **************************************************************

Ops.Trigger.TriggerIfDecreased = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    value = op.inValue("Value"),
    trigger = op.outTrigger("Trigger");

let lastValue = -Number.MAX_VALUE;

value.onChange = function ()
{
    const v = value.get();
    if (v < lastValue)
    {
        trigger.trigger();
    }
    lastValue = v;
};


};

Ops.Trigger.TriggerIfDecreased.prototype = new CABLES.Op();
CABLES.OPS["16ec4069-3682-461e-95ff-1d86e3f44512"]={f:Ops.Trigger.TriggerIfDecreased,objName:"Ops.Trigger.TriggerIfDecreased"};




// **************************************************************
// 
// Ops.Trigger.TriggersPerSecond
// 
// **************************************************************

Ops.Trigger.TriggersPerSecond = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe = op.inTrigger("exe"),
    cps = op.outNumber("cps");

let timeStart = 0;
let cpsCount = 0;

exe.onTriggered = function ()
{
    if (timeStart === 0)timeStart = CABLES.now();
    let now = CABLES.now();

    if (now - timeStart > 1000)
    {
        timeStart = CABLES.now();
        op.setUiAttrib({ "extendTitle": cpsCount });
        cps.set(cpsCount);
        cpsCount = 0;
    }

    cpsCount++;
};


};

Ops.Trigger.TriggersPerSecond.prototype = new CABLES.Op();
CABLES.OPS["ece2f153-eb31-4268-b0e5-8143ad2fdd81"]={f:Ops.Trigger.TriggersPerSecond,objName:"Ops.Trigger.TriggersPerSecond"};




// **************************************************************
// 
// Ops.Devices.Mouse.MouseButtons
// 
// **************************************************************

Ops.Devices.Mouse.MouseButtons = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    mouseClickLeft = op.outTrigger("Click Left"),
    mouseClickRight = op.outTrigger("Click Right"),
    mouseDoubleClick = op.outTrigger("Double Click"),
    mouseDownLeft = op.outBoolNum("Button pressed Left", false),
    mouseDownMiddle = op.outBoolNum("Button pressed Middle", false),
    mouseDownRight = op.outBoolNum("Button pressed Right", false),
    triggerMouseDownLeft = op.outTrigger("Mouse Down Left"),
    triggerMouseDownMiddle = op.outTrigger("Mouse Down Middle"),
    triggerMouseDownRight = op.outTrigger("Mouse Down Right"),
    triggerMouseUpLeft = op.outTrigger("Mouse Up Left"),
    triggerMouseUpMiddle = op.outTrigger("Mouse Up Middle"),
    triggerMouseUpRight = op.outTrigger("Mouse Up Right"),
    area = op.inValueSelect("Area", ["Canvas", "Document"], "Canvas"),
    active = op.inValueBool("Active", true);

const cgl = op.patch.cgl;
let listenerElement = null;
area.onChange = updateListeners;
op.onDelete = removeListeners;
updateListeners();

function onMouseDown(e)
{
    if (e.which == 1)
    {
        mouseDownLeft.set(true);
        triggerMouseDownLeft.trigger();
    }
    else if (e.which == 2)
    {
        mouseDownMiddle.set(true);
        triggerMouseDownMiddle.trigger();
    }
    else if (e.which == 3)
    {
        mouseDownRight.set(true);
        triggerMouseDownRight.trigger();
    }
}

function onMouseUp(e)
{
    if (e.which == 1)
    {
        mouseDownLeft.set(false);
        triggerMouseUpLeft.trigger();
    }
    else if (e.which == 2)
    {
        mouseDownMiddle.set(false);
        triggerMouseUpMiddle.trigger();
    }
    else if (e.which == 3)
    {
        mouseDownRight.set(false);
        triggerMouseUpRight.trigger();
    }
}

function onClickRight(e)
{
    mouseClickRight.trigger();
    e.preventDefault();
}

function onDoubleClick(e)
{
    mouseDoubleClick.trigger();
}

function onmouseclick(e)
{
    mouseClickLeft.trigger();
}

function ontouchstart(event)
{
    if (event.touches && event.touches.length > 0)
    {
        event.touches[0].which = 1;
        onMouseDown(event.touches[0]);
    }
}

function ontouchend(event)
{
    onMouseUp({ "which": 1 });
}

function removeListeners()
{
    if (!listenerElement) return;
    listenerElement.removeEventListener("touchend", ontouchend);
    listenerElement.removeEventListener("touchcancel", ontouchend);
    listenerElement.removeEventListener("touchstart", ontouchstart);
    listenerElement.removeEventListener("dblclick", onDoubleClick);
    listenerElement.removeEventListener("click", onmouseclick);
    listenerElement.removeEventListener("mousedown", onMouseDown);
    listenerElement.removeEventListener("mouseup", onMouseUp);
    listenerElement.removeEventListener("contextmenu", onClickRight);
    listenerElement.removeEventListener("mouseleave", onMouseUp);
    listenerElement = null;
}

function addListeners()
{
    if (listenerElement)removeListeners();

    listenerElement = cgl.canvas;
    if (area.get() == "Document") listenerElement = document.body;

    listenerElement.addEventListener("touchend", ontouchend);
    listenerElement.addEventListener("touchcancel", ontouchend);
    listenerElement.addEventListener("touchstart", ontouchstart);
    listenerElement.addEventListener("dblclick", onDoubleClick);
    listenerElement.addEventListener("click", onmouseclick);
    listenerElement.addEventListener("mousedown", onMouseDown);
    listenerElement.addEventListener("mouseup", onMouseUp);
    listenerElement.addEventListener("contextmenu", onClickRight);
    listenerElement.addEventListener("mouseleave", onMouseUp);
}

op.onLoaded = updateListeners;

active.onChange = updateListeners;

function updateListeners()
{
    removeListeners();
    if (active.get()) addListeners();
}


};

Ops.Devices.Mouse.MouseButtons.prototype = new CABLES.Op();
CABLES.OPS["c7e5e545-c8a1-4fef-85c2-45422b947f0d"]={f:Ops.Devices.Mouse.MouseButtons,objName:"Ops.Devices.Mouse.MouseButtons"};




// **************************************************************
// 
// Ops.Array.ArrayIndexMinMax
// 
// **************************************************************

Ops.Array.ArrayIndexMinMax = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inArr=op.inArray("Array"),
    outMax=op.outNumber("Max"),
    outIndexMax=op.outNumber("Index Max"),
    outMin=op.outNumber("Min"),
    outIndexMin=op.outNumber("Index Min");

inArr.onChange=
outMax.onChange=
outIndexMax.onChange=
outMin.onChange=
outIndexMin.onChange=()=>
{

    const arr=inArr.get();

    if(!arr)
    {
        outMax.set(0);
        outMin.set(0);
        return;
    }

    let min=Number.MAX_VALUE;
    let max=-Number.MAX_VALUE;
    let minIndex=-1;
    let maxIndex=-1;

    for(let i=0;i<arr.length;i++)
    {

        if(arr[i]<min)
        {
            minIndex=i;
            min=arr[i];
        }
        if(arr[i]>max)
        {
            maxIndex=i;
            max=arr[i];
        }

    }

    outMax.set(max);
    outIndexMax.set(maxIndex);
    outMin.set(min);
    outIndexMin.set(minIndex);


};

};

Ops.Array.ArrayIndexMinMax.prototype = new CABLES.Op();
CABLES.OPS["240172a6-7dde-4dcc-b862-bbe764aec3f3"]={f:Ops.Array.ArrayIndexMinMax,objName:"Ops.Array.ArrayIndexMinMax"};




// **************************************************************
// 
// Ops.Math.MathExpression
// 
// **************************************************************

Ops.Math.MathExpression = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const inA = op.inFloat("A", 0);
const inB = op.inFloat("B", 1);
const inC = op.inFloat("C", 2);
const inD = op.inFloat("D", 3);
op.setPortGroup("Parameters", [inA, inB, inC, inD]);
const inExpression = op.inString("Expression", "a*(b+c+d)");
op.setPortGroup("Expression", [inExpression]);
const outResult = op.outNumber("Result");
const outExpressionIsValid = op.outBool("Expression Valid");

let currentFunction = inExpression.get();
let functionValid = false;

const createFunction = () =>
{
    try
    {
        currentFunction = new Function("m", "a", "b", "c", "d", `with(m) { return ${inExpression.get()} }`);
        functionValid = true;
        evaluateFunction();
        outExpressionIsValid.set(functionValid);
    }
    catch (e)
    {
        functionValid = false;
        outExpressionIsValid.set(functionValid);
        if (e instanceof ReferenceError || e instanceof SyntaxError) return;
    }
};

const evaluateFunction = () =>
{
    if (functionValid)
    {
        outResult.set(currentFunction(Math, inA.get(), inB.get(), inC.get(), inD.get()));
        if (!inExpression.get()) outResult.set(0);
    }

    outExpressionIsValid.set(functionValid);
};


inA.onChange = inB.onChange = inC.onChange = inD.onChange = evaluateFunction;
inExpression.onChange = createFunction;
createFunction();


};

Ops.Math.MathExpression.prototype = new CABLES.Op();
CABLES.OPS["d2343a1e-64ea-45b2-99ed-46e167bbdcd3"]={f:Ops.Math.MathExpression,objName:"Ops.Math.MathExpression"};




// **************************************************************
// 
// Ops.Gl.Textures.CopyTexture_v2
// 
// **************************************************************

Ops.Gl.Textures.CopyTexture_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"copytexture_frag":"UNI float a;\nUNI sampler2D tex;\n\n#ifdef TEX_MASK\nUNI sampler2D texMask;\n#endif\n\nIN vec2 texCoord;\n\nvoid main()\n{\n    vec4 col=texture(tex,texCoord);\n\n    #ifdef TEX_MASK\n        col.a=texture(texMask,texCoord).r;\n    #endif\n\n\n    #ifdef GREY_R\n        col.rgb=vec3(col.r);\n    #endif\n\n    #ifdef GREY_G\n        col.rgb=vec3(col.g);\n    #endif\n\n    #ifdef GREY_B\n        col.rgb=vec3(col.b);\n    #endif\n\n    #ifdef GREY_A\n        col.rgb=vec3(col.a);\n    #endif\n\n    #ifdef GREY_LUMI\n        col.rgb=vec3( dot(vec3(0.2126,0.7152,0.0722), col.rgb) );\n    #endif\n\n\n    #ifdef INVERT_A\n        col.a=1.0-col.a;\n    #endif\n\n    #ifdef INVERT_R\n        col.r=1.0-col.r;\n    #endif\n\n    #ifdef INVERT_G\n        col.g=1.0-col.g;\n    #endif\n\n    #ifdef INVERT_B\n        col.b=1.0-col.b;\n    #endif\n\n    #ifdef ALPHA_1\n        col.a=1.0;\n    #endif\n\n\n\n\n    outColor= col;\n}",};
const
    render = op.inTriggerButton("render"),
    inTexture = op.inTexture("Texture"),
    inTextureMask = op.inTexture("Alpha Mask"),
    useVPSize = op.inValueBool("use original size", true),
    width = op.inValueInt("width", 640),
    height = op.inValueInt("height", 360),
    tfilter = op.inSwitch("filter", ["nearest", "linear", "mipmap"], "linear"),
    twrap = op.inValueSelect("wrap", ["clamp to edge", "repeat", "mirrored repeat"], "clamp to edge"),
    fpTexture = op.inValueBool("HDR"),
    alphaMaskMethod = op.inSwitch("Alpha Mask Source", ["A", "1"], "A"),
    greyscale = op.inSwitch("Convert Greyscale", ["Off", "R", "G", "B", "A", "Luminance"], "Off"),
    invertR = op.inBool("Invert R", false),
    invertG = op.inBool("Invert G", false),
    invertB = op.inBool("Invert B", false),
    invertA = op.inBool("Invert A", false),

    trigger = op.outTrigger("trigger"),
    texOut = op.outTexture("texture_out", null),
    outRatio = op.outNumber("Aspect Ratio");

alphaMaskMethod.setUiAttribs({ "hidePort": true });
greyscale.setUiAttribs({ "hidePort": true });
invertR.setUiAttribs({ "hidePort": true });
invertG.setUiAttribs({ "hidePort": true });
invertB.setUiAttribs({ "hidePort": true });

let autoRefreshTimeout = null;
const cgl = op.patch.cgl;
let lastTex = null;
let effect = null;
let tex = null;
let needsResUpdate = true;

let w = 2, h = 2;
const prevViewPort = [0, 0, 0, 0];
let reInitEffect = true;

op.toWorkPortsNeedToBeLinked(render, inTexture);
op.setPortGroup("Size", [useVPSize, width, height]);

const bgShader = new CGL.Shader(cgl, "copytexture");
bgShader.setSource(bgShader.getDefaultVertexShader(), attachments.copytexture_frag);
const textureUniform = new CGL.Uniform(bgShader, "t", "tex", 0);
let textureMaskUniform = new CGL.Uniform(bgShader, "t", "texMask", 1);

let selectedFilter = CGL.Texture.FILTER_LINEAR;
let selectedWrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;

alphaMaskMethod.onChange =
    greyscale.onChange =
    invertR.onChange =
    invertG.onChange =
    invertB.onChange =
    twrap.onChange =
    tfilter.onChange =
    fpTexture.onChange =
    render.onLinkChanged =
    inTexture.onLinkChanged =
    inTexture.onChange =
    inTextureMask.onChange = updateSoon;

render.onTriggered = doRender;
updateSizePorts();

function initEffect()
{
    if (effect)effect.delete();
    if (tex)
    {
        tex.delete();
        tex = null;
    }

    effect = new CGL.TextureEffect(cgl, { "isFloatingPointTexture": fpTexture.get(), "clear": false });

    if (!tex ||
        tex.width != Math.floor(width.get()) ||
        tex.height != Math.floor(height.get()) ||
        tex.wrap != selectedWrap ||
        tex.isFloatingPoint() != fpTexture.get()
    )
    {
        if (tex) tex.delete();
        tex = new CGL.Texture(cgl,
            {
                "name": "copytexture_" + op.id,
                "isFloatingPointTexture": fpTexture.get(),
                "filter": selectedFilter,
                "wrap": selectedWrap,
                "width": Math.floor(width.get()),
                "height": Math.floor(height.get()),
            });
    }

    effect.setSourceTexture(tex);
    texOut.set(null);
    reInitEffect = false;
}

function updateSoon()
{
    updateParams();
    reInitEffect = true;

    if (!render.isLinked() || !inTexture.isLinked()) texOut.set(CGL.Texture.getEmptyTexture(cgl));
}

function updateResolution()
{
    if (!inTexture.get() || inTexture.get() == CGL.Texture.getEmptyTexture(cgl)) return;
    if (!effect)initEffect();

    if (useVPSize.get())
    {
        w = inTexture.get().width;
        h = inTexture.get().height;
    }
    else
    {
        w = Math.floor(width.get());
        h = Math.floor(height.get());
    }

    if ((w != tex.width || h != tex.height) && (w !== 0 && h !== 0))
    {
        height.set(h);
        width.set(w);
        tex.filter = selectedFilter;
        tex.setSize(w, h);
        outRatio.set(w / h);
        effect.setSourceTexture(tex);
    }

    if (texOut.get() && selectedFilter != CGL.Texture.FILTER_NEAREST)
    {
        if (!texOut.get().isPowerOfTwo()) op.setUiError("hintnpot", "texture dimensions not power of two! - texture filtering when scaling will not work on ios devices.", 0);
        else op.setUiError("hintnpot", null, 0);
    }
    else op.setUiError("hintnpot", null, 0);

    needsResUpdate = false;
}

function updateSizePorts()
{
    width.setUiAttribs({ "greyout": useVPSize.get() });
    height.setUiAttribs({ "greyout": useVPSize.get() });
}

function updateResolutionLater()
{
    needsResUpdate = true;
    updateSoon();
}

useVPSize.onChange = function ()
{
    updateSizePorts();
    if (useVPSize.get())
    {
        width.onChange = null;
        height.onChange = null;
    }
    else
    {
        width.onChange = updateResolutionLater;
        height.onChange = updateResolutionLater;
    }
    updateResolution();
};

function doRender()
{
    // op.patch.removeOnAnimCallback(doRender);
    // if (!inTexture.get())

    if (!inTexture.get() || inTexture.get() == CGL.Texture.getEmptyTexture(cgl)) texOut.set(CGL.Texture.getEmptyTexture(cgl));

    if (!inTexture.get() || inTexture.get() == CGL.Texture.getEmptyTexture(cgl))
    {
        lastTex = null;// CGL.Texture.getEmptyTexture(cgl);
        trigger.trigger();
        return;
    }
    else
    if (!effect || reInitEffect || lastTex != inTexture.get())
    {
        initEffect();
    }
    const vp = cgl.getViewPort();
    prevViewPort[0] = vp[0];
    prevViewPort[1] = vp[1];
    prevViewPort[2] = vp[2];
    prevViewPort[3] = vp[3];

    updateResolution();

    lastTex = inTexture.get();
    const oldEffect = cgl.currentTextureEffect;
    cgl.currentTextureEffect = effect;
    effect.setSourceTexture(tex);

    effect.startEffect();

    // render background color...
    cgl.pushShader(bgShader);
    cgl.currentTextureEffect.bind();
    cgl.setTexture(0, inTexture.get().tex);
    if (inTextureMask.get())cgl.setTexture(1, inTextureMask.get().tex);

    cgl.pushBlend(false);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    cgl.popBlend();

    texOut.set(effect.getCurrentSourceTexture());

    effect.endEffect();

    cgl.setViewPort(prevViewPort[0], prevViewPort[1], prevViewPort[2], prevViewPort[3]);

    cgl.currentTextureEffect = oldEffect;

    cgl.setTexture(0, CGL.Texture.getEmptyTexture(cgl).tex);

    trigger.trigger();
}

function updateParams()
{
    bgShader.toggleDefine("TEX_MASK", inTextureMask.get());

    bgShader.toggleDefine("GREY_R", greyscale.get() === "R");
    bgShader.toggleDefine("GREY_G", greyscale.get() === "G");
    bgShader.toggleDefine("GREY_B", greyscale.get() === "B");
    bgShader.toggleDefine("GREY_A", greyscale.get() === "A");
    bgShader.toggleDefine("GREY_LUMI", greyscale.get() === "Luminance");

    bgShader.toggleDefine("ALPHA_1", alphaMaskMethod.get() === "1");
    bgShader.toggleDefine("ALPHA_A", alphaMaskMethod.get() === "A");

    bgShader.toggleDefine("INVERT_R", invertR.get());
    bgShader.toggleDefine("INVERT_G", invertG.get());
    bgShader.toggleDefine("INVERT_B", invertB.get());
    bgShader.toggleDefine("INVERT_A", invertA.get());

    if (twrap.get() == "repeat") selectedWrap = CGL.Texture.WRAP_REPEAT;
    else if (twrap.get() == "mirrored repeat") selectedWrap = CGL.Texture.WRAP_MIRRORED_REPEAT;
    else if (twrap.get() == "clamp to edge") selectedWrap = CGL.Texture.WRAP_CLAMP_TO_EDGE;

    if (tfilter.get() == "nearest") selectedFilter = CGL.Texture.FILTER_NEAREST;
    else if (tfilter.get() == "linear") selectedFilter = CGL.Texture.FILTER_LINEAR;
    else if (tfilter.get() == "mipmap") selectedFilter = CGL.Texture.FILTER_MIPMAP;

    if (bgShader.needsRecompile())
    {
        reInitEffect = true;
    }
    if (tex && (
        tex.width != Math.floor(width.get()) ||
        tex.height != Math.floor(height.get()) ||
        tex.wrap != selectedWrap ||
        tex.isFloatingPoint() != fpTexture.get()
    ))
    {
        reInitEffect = true;
    }
}


};

Ops.Gl.Textures.CopyTexture_v2.prototype = new CABLES.Op();
CABLES.OPS["7a86fd19-571a-48ab-9e37-dd84e9f428e7"]={f:Ops.Gl.Textures.CopyTexture_v2,objName:"Ops.Gl.Textures.CopyTexture_v2"};




// **************************************************************
// 
// Ops.Cables.CallBack_v2
// 
// **************************************************************

Ops.Cables.CallBack_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const exe = op.inTriggerButton("exe");
const callbackname = op.inString("Callback Name", "myFunction");
const val0 = op.inString("Parameter 1", "");
const val1 = op.inString("Parameter 2", "");
const val2 = op.inString("Parameter 3", "");

let values = [0, 0, 0];

val0.onChange = function () { values[0] = val0.get(); };
val1.onChange = function () { values[1] = val1.get(); };
val2.onChange = function () { values[2] = val2.get(); };

exe.onTriggered = function ()
{
    if (op.patch.config.hasOwnProperty(callbackname.get()))
    {
        op.patch.config[callbackname.get()](values);
    }
    else
    {
        op.log("callback ", callbackname.get(), " not found! Parameters: ", values);
    }
};


};

Ops.Cables.CallBack_v2.prototype = new CABLES.Op();
CABLES.OPS["cfc87cb1-a74b-482f-9fad-e1777cb7ffd4"]={f:Ops.Cables.CallBack_v2,objName:"Ops.Cables.CallBack_v2"};




// **************************************************************
// 
// Ops.Math.Ceil
// 
// **************************************************************

Ops.Math.Ceil = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const number1 = op.inValue("Number");
const result = op.outNumber("Result");

function exec()
{
    result.set(Math.ceil(number1.get()));
}

number1.onChange = exec;


};

Ops.Math.Ceil.prototype = new CABLES.Op();
CABLES.OPS["15ba7aa9-b1c3-4b20-b6bf-b52a3ba8c8c5"]={f:Ops.Math.Ceil,objName:"Ops.Math.Ceil"};




// **************************************************************
// 
// Ops.Array.ArrayFromNumbers
// 
// **************************************************************

Ops.Array.ArrayFromNumbers = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inUpdate = op.inTrigger("Update"),
    inLimit = op.inInt("Limit", 30),
    inSlider = op.inBool("Slider", false),
    next = op.outTrigger("Next"),
    outArr = op.outArray("Array");

const inPorts = [];
for (let i = 0; i < 30; i++)
{
    const inp = op.inFloat("Index " + i, 0);
    inPorts.push(inp);
}

const arr = [];
let to = null;

inUpdate.onTriggered = update;

inSlider.onChange = () =>
{
    const l = inLimit.get();

    for (let i = 0; i < inPorts.length; i++)
        if (inSlider.get()) inPorts[i].setUiAttribs({ "display": "range" });
        else inPorts[i].setUiAttribs({ "display": null });

    op.refreshParams();
};

inLimit.onChange = () =>
{
    clearTimeout(to);

    to = setTimeout(() =>
    {
        const l = inLimit.get();
        for (let i = 0; i < inPorts.length; i++)
        {
            inPorts[i].setUiAttribs({ "greyout": i >= l });
        }
    }, 300);
};

function update()
{
    const l = Math.max(0, Math.ceil(Math.min(inLimit.get(), inPorts.length)));
    arr.length = l;
    for (let i = 0; i < l; i++)
    {
        arr[i] = inPorts[i].get();
    }

    outArr.set(null);
    outArr.set(arr);
    next.trigger();
}


};

Ops.Array.ArrayFromNumbers.prototype = new CABLES.Op();
CABLES.OPS["fb698158-3cf8-49d6-805e-6ea38fdab8c1"]={f:Ops.Array.ArrayFromNumbers,objName:"Ops.Array.ArrayFromNumbers"};




// **************************************************************
// 
// Ops.Array.ArrayGetString
// 
// **************************************************************

Ops.Array.ArrayGetString = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    array = op.inArray("array"),
    index = op.inValueInt("index"),
    result = op.outString("result");

array.ignoreValueSerialize = true;

index.onChange = update;

array.onChange = function ()
{
    update();
};

function update()
{
    const arr = array.get();
    if (arr) result.set(arr[index.get()]);
}


};

Ops.Array.ArrayGetString.prototype = new CABLES.Op();
CABLES.OPS["be8f16c0-0c8a-48a2-a92b-45dbf88c76c1"]={f:Ops.Array.ArrayGetString,objName:"Ops.Array.ArrayGetString"};




// **************************************************************
// 
// Ops.Gl.TriggerOnCanvasResize
// 
// **************************************************************

Ops.Gl.TriggerOnCanvasResize = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const onResize = op.outTrigger("Resized");

let listener = op.patch.cgl.on("resize", resize);

function resize()
{
    onResize.trigger();
}

op.onDelete = () =>
{
    op.patch.cgl.off(listener);
};


};

Ops.Gl.TriggerOnCanvasResize.prototype = new CABLES.Op();
CABLES.OPS["856de8cf-b8d1-4668-b8ff-80c68bc73ddd"]={f:Ops.Gl.TriggerOnCanvasResize,objName:"Ops.Gl.TriggerOnCanvasResize"};




// **************************************************************
// 
// Ops.Cables.LoadingStatusTask
// 
// **************************************************************

Ops.Cables.LoadingStatusTask = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
// vars
let stack = [];
let uuid = CABLES.uuid();

// inputs
let startPort = op.inTriggerButton("Start Task");
let stopPort = op.inTriggerButton("End Task");

// listeners
startPort.onTriggered = startTask;
stopPort.onTriggered = stopTask;

function startTask()
{
    let id = uuid + " (" + (stack.length + 1) + ")";
    let loadingId = op.patch.loading.start("task", id);
    if (CABLES.UI)
    {
        gui.jobs().start({ "id": loadingId, "title": "loading task " + id });
    }

    stack.push(loadingId);
}

function stopTask()
{
    let loadingId = stack.pop();
    op.patch.loading.finished(loadingId);
    if (CABLES.UI)
    {
        gui.jobs().finish(loadingId);
    }
}


};

Ops.Cables.LoadingStatusTask.prototype = new CABLES.Op();
CABLES.OPS["38d0f6ba-a4d8-4093-9cab-17e1b5dd52ae"]={f:Ops.Cables.LoadingStatusTask,objName:"Ops.Cables.LoadingStatusTask"};




// **************************************************************
// 
// Ops.Cables.LoadingStatus_v2
// 
// **************************************************************

Ops.Cables.LoadingStatus_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe = op.inTrigger("exe"),
    preRenderOps = op.inValueBool("PreRender Ops"),
    startTimeLine = op.inBool("Play Timeline", true),
    next = op.outTrigger("Next"),
    outInitialFinished = op.outBoolNum("Finished Initial Loading", false),
    outLoading = op.outBoolNum("Loading"),
    outProgress = op.outNumber("Progress"),
    outList = op.outArray("Jobs"),
    loadingFinished = op.outTrigger("Trigger Loading Finished ");

const cgl = op.patch.cgl;
const patch = op.patch;

let finishedOnce = false;
const preRenderTimes = [];
let firstTime = true;

document.body.classList.add("cables-loading");

let loadingId = cgl.patch.loading.start("loadingStatusInit", "loadingStatusInit", op);

exe.onTriggered = () =>
{
    const jobs = op.patch.loading.getListJobs();
    outProgress.set(patch.loading.getProgress());

    let hasFinished = jobs.length === 0;
    const notFinished = !hasFinished;
    // outLoading.set(!hasFinished);

    if (notFinished)
    {
        outList.set(op.patch.loading.getListJobs());
    }

    if (notFinished)
    {
        if (firstTime)
        {
            if (preRenderOps.get()) op.patch.preRenderOps();

            op.patch.timer.setTime(0);
            if (startTimeLine.get())
            {
                op.patch.timer.play();
            }
            else
            {
                op.patch.timer.pause();
            }
        }
        firstTime = false;

        document.body.classList.remove("cables-loading");
        document.body.classList.add("cables-loaded");
    }
    else
    {
        finishedOnce = true;
        outList.set(op.patch.loading.getListJobs());
        if (patch.loading.getProgress() < 1.0)
        {
            op.patch.timer.setTime(0);
            op.patch.timer.pause();
        }
    }

    outInitialFinished.set(finishedOnce);

    if (outLoading.get() && hasFinished) loadingFinished.trigger();

    outLoading.set(notFinished);
    op.setUiAttribs({ "loading": notFinished });

    next.trigger();

    if (loadingId)
    {
        cgl.patch.loading.finished(loadingId);
        loadingId = null;
    }
};


};

Ops.Cables.LoadingStatus_v2.prototype = new CABLES.Op();
CABLES.OPS["e62f7f4c-7436-437e-8451-6bc3c28545f7"]={f:Ops.Cables.LoadingStatus_v2,objName:"Ops.Cables.LoadingStatus_v2"};




// **************************************************************
// 
// Ops.Html.LoadingIndicator
// 
// **************************************************************

Ops.Html.LoadingIndicator = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"css_ellipsis_css":".lds-ellipsis {\n\n}\n.lds-ellipsis div {\n  position: absolute;\n  /*top: 33px;*/\n  margin-top:-12px;\n  margin-left:-13px;\n  width: 13px;\n  height: 13px;\n  border-radius: 50%;\n  background: #fff;\n  animation-timing-function: cubic-bezier(0, 1, 1, 0);\n}\n.lds-ellipsis div:nth-child(1) {\n  left: 8px;\n  animation: lds-ellipsis1 0.6s infinite;\n}\n.lds-ellipsis div:nth-child(2) {\n  left: 8px;\n  animation: lds-ellipsis2 0.6s infinite;\n}\n.lds-ellipsis div:nth-child(3) {\n  left: 32px;\n  animation: lds-ellipsis2 0.6s infinite;\n}\n.lds-ellipsis div:nth-child(4) {\n  left: 56px;\n  animation: lds-ellipsis3 0.6s infinite;\n}\n@keyframes lds-ellipsis1 {\n  0% {\n    transform: scale(0);\n  }\n  100% {\n    transform: scale(1);\n  }\n}\n@keyframes lds-ellipsis3 {\n  0% {\n    transform: scale(1);\n  }\n  100% {\n    transform: scale(0);\n  }\n}\n@keyframes lds-ellipsis2 {\n  0% {\n    transform: translate(0, 0);\n  }\n  100% {\n    transform: translate(24px, 0);\n  }\n}\n","css_ring_css":".lds-ring {\n}\n.lds-ring div {\n  box-sizing: border-box;\n  display: block;\n  position: absolute;\n  width: 100%;\n  height: 100%;\n  margin: 0;\n  border: 3px solid #fff;\n  border-radius: 50%;\n  animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;\n  border-color: #fff transparent transparent transparent;\n}\n.lds-ring div:nth-child(1) {\n  animation-delay: -0.45s;\n}\n.lds-ring div:nth-child(2) {\n  animation-delay: -0.3s;\n}\n.lds-ring div:nth-child(3) {\n  animation-delay: -0.15s;\n}\n@keyframes lds-ring {\n  0% {\n    transform: rotate(0deg);\n  }\n  100% {\n    transform: rotate(360deg);\n  }\n}\n","css_spinner_css":"._cables_spinner {\n  /*width: 40px;*/\n  /*height: 40px;*/\n  /*margin: 100px auto;*/\n  background-color: #777;\n\n  border-radius: 100%;\n  -webkit-animation: sk-scaleout 1.0s infinite ease-in-out;\n  animation: sk-scaleout 1.0s infinite ease-in-out;\n}\n\n@-webkit-keyframes sk-scaleout {\n  0% { -webkit-transform: scale(0) }\n  100% {\n    -webkit-transform: scale(1.0);\n    opacity: 0;\n  }\n}\n\n@keyframes sk-scaleout {\n  0% {\n    -webkit-transform: scale(0);\n    transform: scale(0);\n  } 100% {\n    -webkit-transform: scale(1.0);\n    transform: scale(1.0);\n    opacity: 0;\n  }\n}",};
const
    inVisible = op.inBool("Visible", true),
    inStyle = op.inSwitch("Style", ["Spinner", "Ring", "Ellipsis"], "Ring");

const div = document.createElement("div");
div.dataset.op = op.id;
const canvas = op.patch.cgl.canvas.parentElement;

inStyle.onChange = updateStyle;

div.appendChild(document.createElement("div"));
div.appendChild(document.createElement("div"));
div.appendChild(document.createElement("div"));

const size = 50;

div.style.width = size + "px";
div.style.height = size + "px";
div.style.top = "50%";
div.style.left = "50%";
// div.style.border="1px solid red";

div.style["margin-left"] = "-" + size / 2 + "px";
div.style["margin-top"] = "-" + size / 2 + "px";

div.style.position = "absolute";
div.style["z-index"] = "9999999";

inVisible.onChange = updateVisible;

let eleId = "css_loadingicon_" + CABLES.uuid();

const styleEle = document.createElement("style");
styleEle.type = "text/css";
styleEle.id = eleId;

let head = document.getElementsByTagName("body")[0];
head.appendChild(styleEle);

op.onDelete = () =>
{
    remove();
    if (styleEle)styleEle.remove();
};

updateStyle();

function updateStyle()
{
    const st = inStyle.get();
    if (st == "Spinner")
    {
        div.classList.add("_cables_spinner");
        styleEle.textContent = attachments.css_spinner_css;
    }
    else div.classList.remove("_cables_spinner");

    if (st == "Ring")
    {
        div.classList.add("lds-ring");
        styleEle.textContent = attachments.css_ring_css;
    }
    else div.classList.remove("lds-ring");

    if (st == "Ellipsis")
    {
        div.classList.add("lds-ellipsis");
        styleEle.textContent = attachments.css_ellipsis_css;
    }
    else div.classList.remove("lds-ellipsis");
}

function remove()
{
    div.remove();
    // if (styleEle)styleEle.remove();
}

function updateVisible()
{
    remove();
    if (inVisible.get()) canvas.appendChild(div);
}


};

Ops.Html.LoadingIndicator.prototype = new CABLES.Op();
CABLES.OPS["e102834c-6dcf-459c-9e22-44ebccfc0d3b"]={f:Ops.Html.LoadingIndicator,objName:"Ops.Html.LoadingIndicator"};




// **************************************************************
// 
// Ops.Gl.CanvasInfo
// 
// **************************************************************

Ops.Gl.CanvasInfo = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    width = op.outNumber("width"),
    height = op.outNumber("height"),
    inUnit = op.inSwitch("Pixel Unit", ["Display", "CSS"], "Display"),
    pixelRatio = op.outNumber("Pixel Ratio"),
    aspect = op.outNumber("Aspect Ratio"),
    landscape = op.outBool("Landscape"),
    outCanvasEle = op.outObject("Canvas", "element"),
    outCanvasParentEle = op.outObject("Canvas Parent", "element");

let cgl = op.patch.cgl;
outCanvasEle.set(op.patch.cgl.canvas);
outCanvasParentEle.set(op.patch.cgl.canvas.parentElement);

cgl.on("resize", update);

inUnit.onChange = update;
update();

function update()
{
    let div = 1;
    if (inUnit.get() == "CSS")div = op.patch.cgl.pixelDensity;
    height.set(cgl.canvasHeight / div);
    width.set(cgl.canvasWidth / div);

    pixelRatio.set(op.patch.cgl.pixelDensity); // window.devicePixelRatio

    aspect.set(cgl.canvasWidth / cgl.canvasHeight);
    landscape.set(cgl.canvasWidth > cgl.canvasHeight ? 1 : 0);
}


};

Ops.Gl.CanvasInfo.prototype = new CABLES.Op();
CABLES.OPS["94e499e5-b4ee-4861-ab48-6ab5098b2cc3"]={f:Ops.Gl.CanvasInfo,objName:"Ops.Gl.CanvasInfo"};




// **************************************************************
// 
// Ops.Html.ElementCssTransform
// 
// **************************************************************

Ops.Html.ElementCssTransform = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inEle = op.inObject("Element", null, "element"),
    inDoTranslate = op.inBool("Translate Active", true),
    inTransX = op.inFloat("Translate X", 0),
    inTransY = op.inFloat("Translate Y", 0),
    inTransUnit = op.inSwitch("Unit", ["px", "%"], "px"),

    inDoScale = op.inBool("Scale Active", true),
    inScale = op.inFloat("Scale", 1),

    inDoRot = op.inBool("Rotate Active", true),
    inRot = op.inFloat("Rot Z", 0),

    inDoOrigin = op.inBool("Set Origin", true),
    inOriginX = op.inSwitch("Origin X", ["left", "center", "right"], "center"),
    inOriginY = op.inSwitch("Origin Y", ["top", "center", "bottom"], "center");

op.setPortGroup("Element", [inEle]);
op.setPortGroup("Translation", [inDoTranslate, inTransY, inTransX, inTransUnit]);
op.setPortGroup("Scaling", [inScale, inDoScale]);
op.setPortGroup("Rotation", [inDoRot, inRot]);
op.setPortGroup("Origin", [inDoOrigin, inOriginX, inOriginY]);

inTransUnit.onChange =
    inDoScale.onChange =
    inDoOrigin.onChange =
    inOriginX.onChange =
    inOriginY.onChange =
    inDoRot.onChange =
    inDoTranslate.onChange =
    inDoRot.onChange =
    inTransX.onChange =
    inTransY.onChange =
    inScale.onChange =
    inRot.onChange = update;

let ele = null;

inEle.onChange = inEle.onLinkChanged = function ()
{
    if (ele && ele.style)
    {
        ele.style.transform = "initial";
    }
    update();
};

function update()
{
    ele = inEle.get();
    if (ele && ele.style)
    {
        let str = "";

        if (inDoTranslate.get())
            if (inTransY.get() || inTransX.get())
                str += "translate(" + inTransX.get() + inTransUnit.get() + " , " + inTransY.get() + inTransUnit.get() + ") ";

        if (inDoScale.get())
            if (inScale.get() != 1.0)
                str += "scale(" + inScale.get() + ") ";

        if (inDoRot.get())
            if (inRot.get() != 0.0)
                str += "rotateZ(" + inRot.get() + "deg) ";

        try
        {
            ele.style.transform = str;

            if (inDoOrigin.get())
                ele.style["transform-origin"] = inOriginY.get() + " " + inOriginX.get();
            else
                ele.style["transform-origin"] = "initial";
        }
        catch (e)
        {
            op.logError(e);
        }
    }
    else
    {
        setTimeout(update, 50);
    }

    // outEle.set(inEle.get());
}


};

Ops.Html.ElementCssTransform.prototype = new CABLES.Op();
CABLES.OPS["777d00c6-5605-43c5-9b6a-b20d465bd3ba"]={f:Ops.Html.ElementCssTransform,objName:"Ops.Html.ElementCssTransform"};




// **************************************************************
// 
// Ops.Boolean.Or
// 
// **************************************************************

Ops.Boolean.Or = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    bool0 = op.inValueBool("bool 1"),
    bool1 = op.inValueBool("bool 2"),
    bool2 = op.inValueBool("bool 3"),
    bool3 = op.inValueBool("bool 4"),
    bool4 = op.inValueBool("bool 5"),
    bool5 = op.inValueBool("bool 6"),
    bool6 = op.inValueBool("bool 7"),
    bool7 = op.inValueBool("bool 8"),
    bool8 = op.inValueBool("bool 9"),
    bool9 = op.inValueBool("bool 10"),
    result = op.outBoolNum("result");

bool0.onChange =
    bool1.onChange =
    bool2.onChange =
    bool3.onChange =
    bool4.onChange =
    bool5.onChange =
    bool6.onChange =
    bool7.onChange =
    bool8.onChange =
    bool9.onChange = exec;

function exec()
{
    result.set(bool0.get() || bool1.get() || bool2.get() || bool3.get() || bool4.get() || bool5.get() || bool6.get() || bool7.get() || bool8.get() || bool9.get());
}


};

Ops.Boolean.Or.prototype = new CABLES.Op();
CABLES.OPS["b3b36238-4592-4e11-afe3-8361c4fd6be5"]={f:Ops.Boolean.Or,objName:"Ops.Boolean.Or"};




// **************************************************************
// 
// Ops.TimeLine.TimeLineTogglePlay
// 
// **************************************************************

Ops.TimeLine.TimeLineTogglePlay = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const play=op.inBool("Play",false);

play.onChange=function()
{
    if(play.get()) op.patch.timer.play();
    else op.patch.timer.pause();
}


};

Ops.TimeLine.TimeLineTogglePlay.prototype = new CABLES.Op();
CABLES.OPS["930c6f38-9271-4021-a58b-14dcfc5763b2"]={f:Ops.TimeLine.TimeLineTogglePlay,objName:"Ops.TimeLine.TimeLineTogglePlay"};




// **************************************************************
// 
// Ops.Html.CSSFilter
// 
// **************************************************************

Ops.Html.CSSFilter = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const inEle = op.inObject("Element");
const inMethod = op.inValueSelect("method", ["-", "blur", "brightness", "contrast", "grayscale", "hue-rotate", "invert", "opacity", "saturate", "sepia"]);
const inVal = op.inValue("Value");

let suffix = "";
let prefix = "";

inVal.onChange = setValue;
inEle.onChange = setValue;

let oldEle = null;

function getCSSFilterString()
{
    return inMethod.get() + "(" + inVal.get() + suffix + ")";
}

inEle.onLinkChanged = function ()
{
    // remove style when deleting op
    if (inEle.isLinked()) return;

    const ele = oldEle;// inEle.get();

    if (ele && ele.style)
    {
        let filter = ele.style.filter;
        var str = "";

        if (filter && filter.length > 0)
        {
            var str = "";
            let parts = filter.split(" ");
            for (let i = 0; i < parts.length; i++)
            {
                if (parts[i].indexOf(inMethod.get()) == 0)
                    parts[i] = "";
            }

            str = parts.join(" ");
        }
        ele.style.filter = str;
    }
};

function setValue()
{
    const ele = inEle.get();
    let str = "";

    if (ele && ele.style)
    {
        if (ele != oldEle) oldEle = ele;
        let foundMyFilter = false;
        let filter = ele.style.filter;

        if (filter && filter.length > 0)
        {
            let parts = filter.split(" ");
            for (let i = 0; i < parts.length; i++)
            {
                if (parts[i].indexOf(inMethod.get()) == 0)
                {
                    foundMyFilter = true;
                    parts[i] = getCSSFilterString();
                }
            }

            str = parts.join(" ");
        }

        if (!foundMyFilter)
            str += " " + getCSSFilterString();

        ele.style.filter = str;
    }
}

inMethod.onChange = function ()
{
    let m = inMethod.get();

    prefix = inMethod.get() + ":";

    if (m == "blur") suffix = "px";
    if (m == "brightness") suffix = "";
    if (m == "contrast") suffix = "%";
    if (m == "grayscale") suffix = "%";
    if (m == "hue-rotate") suffix = "deg";
    if (m == "invert") suffix = "%";
    if (m == "opacity") suffix = "%";
    if (m == "saturate") suffix = "";
    if (m == "sepia") suffix = "%";
    setValue();
};


};

Ops.Html.CSSFilter.prototype = new CABLES.Op();
CABLES.OPS["33befabf-7eef-45f6-869f-30e0e4f44739"]={f:Ops.Html.CSSFilter,objName:"Ops.Html.CSSFilter"};




// **************************************************************
// 
// Ops.Website.UrlQueryParams_v2
// 
// **************************************************************

Ops.Website.UrlQueryParams_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    paramName = op.inString("parameter"),
    def = op.inString("Default"),
    result = op.outString("result");

def.onChange = update;
paramName.onChange = updateParam;

const query = {};
const a = window.location.search.substr(1).split("&");

update();

for (let i = 0; i < a.length; i++)
{
    const b = a[i].split("=");
    query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || "");
}

function updateParam()
{
    op.setUiAttrib({ "extendTitle": paramName.get() });
    update();
}

function update()
{
    if (!query.hasOwnProperty(paramName.get()))
    {
        const value = def.get() || null;
        result.set(value);
    }
    else
    {
        let v = query[paramName.get()];
        if (v === "true")v = true;
        else if (v === "false")v = false;

        result.set(v);
    }
}


};

Ops.Website.UrlQueryParams_v2.prototype = new CABLES.Op();
CABLES.OPS["2e1b645c-c463-465d-abec-bf06ee4b970c"]={f:Ops.Website.UrlQueryParams_v2,objName:"Ops.Website.UrlQueryParams_v2"};




// **************************************************************
// 
// Ops.Html.ElementSize
// 
// **************************************************************

Ops.Html.ElementSize = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inExe=op.inTrigger("Update"),
    inMode=op.inSwitch("Position",['Relative','Absolute'],'Relative'),
    inEle=op.inObject("Element"),
    outX=op.outNumber("x"),
    outY=op.outNumber("y"),
    outWidth=op.outNumber("Width"),
    outHeight=op.outNumber("Height");

inMode.onChange=updateMode;
updateMode();

function updateMode()
{
    if(inMode.get()=="Relative")
    {
        inEle.onChange=updateRel;
        inExe.onTriggered=updateRel;
    }
    else
    {
        inEle.onChange=updateAbs;
        inExe.onTriggered=updateAbs;
    }
}

function updateAbs()
{
    const ele=inEle.get();
    if(!ele)return;

    const r=ele.getBoundingClientRect();

    outX.set(r.x);
    outY.set(r.y);
    outWidth.set(r.width);
    outHeight.set(r.height);
}

function updateRel()
{
    const ele=inEle.get();
    if(!ele)return;

    const rcanv=op.patch.cgl.canvas.getBoundingClientRect();
    const r=ele.getBoundingClientRect();
    outX.set(r.x-rcanv.x);
    outY.set(r.y-rcanv.y);
    outWidth.set(r.width);
    outHeight.set(r.height);
}

};

Ops.Html.ElementSize.prototype = new CABLES.Op();
CABLES.OPS["fb23c251-a43e-4677-9d03-ccd512fee82e"]={f:Ops.Html.ElementSize,objName:"Ops.Html.ElementSize"};




// **************************************************************
// 
// Ops.Value.SwitchNumberOnTrigger
// 
// **************************************************************

Ops.Value.SwitchNumberOnTrigger = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    currentVal = op.outNumber("Value"),
    oldVal = op.outNumber("Last Value"),
    triggered = op.outTrigger("Triggered");

let triggers = [];
let inVals = [];
let inExes = [];

function onTrigger()
{
    oldVal.set(currentVal.get());
    currentVal.set(inVals[this.slot].get());
    triggered.trigger();
}

let num = 8;
for (let i = 0; i < num; i++)
{
    let newExe = op.addInPort(new CABLES.Port(op, "Trigger " + i, CABLES.OP_PORT_TYPE_FUNCTION));
    newExe.slot = i;
    newExe.onTriggered = onTrigger.bind(newExe);
    let newVal = op.addInPort(new CABLES.Port(op, "Value " + i, CABLES.OP_PORT_TYPE_VALUE));
    inVals.push(newVal);
}

let defaultVal = op.inValueString("Default Value");

currentVal.set(defaultVal.get());
oldVal.set(defaultVal.get());

defaultVal.onChange = function ()
{
    oldVal.set(currentVal.get());
    currentVal.set(defaultVal.get());
};


};

Ops.Value.SwitchNumberOnTrigger.prototype = new CABLES.Op();
CABLES.OPS["338032c5-bf47-454b-8ae1-cd91f17e5c5b"]={f:Ops.Value.SwitchNumberOnTrigger,objName:"Ops.Value.SwitchNumberOnTrigger"};




// **************************************************************
// 
// Ops.Trigger.SetNumberOnTrigger
// 
// **************************************************************

Ops.Trigger.SetNumberOnTrigger = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    setValuePort = op.inTriggerButton("Set"),
    valuePort = op.inValueFloat("Number"),
    outNext = op.outTrigger("Next"),
    outValuePort = op.outNumber("Out Value");

outValuePort.changeAlways = true;

setValuePort.onTriggered = function ()
{
    outValuePort.set(valuePort.get());
    outNext.trigger();
};


};

Ops.Trigger.SetNumberOnTrigger.prototype = new CABLES.Op();
CABLES.OPS["9989b1c0-1073-4d5f-bfa0-36dd98b66e27"]={f:Ops.Trigger.SetNumberOnTrigger,objName:"Ops.Trigger.SetNumberOnTrigger"};




// **************************************************************
// 
// Ops.Math.Difference
// 
// **************************************************************

Ops.Math.Difference = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    num1 = op.inValue("Number A"),
    num2 = op.inValue("Number B"),
    result = op.outNumber("Result");

num1.onChange =
    num2.onChange = update;

function update()
{
    let r = num1.get() - num2.get();
    r = Math.abs(r);
    result.set(r);
}


};

Ops.Math.Difference.prototype = new CABLES.Op();
CABLES.OPS["5431b943-18aa-46e4-bd32-a7eee30d4e51"]={f:Ops.Math.Difference,objName:"Ops.Math.Difference"};




// **************************************************************
// 
// Ops.Value.PreviousValueStore
// 
// **************************************************************

Ops.Value.PreviousValueStore = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    val = op.inValueFloat("Value"),
    outCurrent = op.outNumber("Current Value"),
    outOldVal = op.outNumber("Previous Value");

let oldValue = 0;

val.onChange = function ()
{
    outOldVal.set(oldValue);
    oldValue = val.get();
    outCurrent.set(val.get());
};


};

Ops.Value.PreviousValueStore.prototype = new CABLES.Op();
CABLES.OPS["01716872-67bd-4b31-a4a2-e0ccadf48411"]={f:Ops.Value.PreviousValueStore,objName:"Ops.Value.PreviousValueStore"};




// **************************************************************
// 
// Ops.Html.ToggleClass
// 
// **************************************************************

Ops.Html.ToggleClass = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inEle = op.inObject("HTML Element"),
    inClassName = op.inString("Classname"),
    inActive = op.inValueBool("Active", true);

inActive.onChange =
    inClassName.onChange =
    inEle.onChange = update;

op.onDelete = remove;

let oldEle = null;
let oldName = null;

function remove(ele)
{
    if (ele && ele.classList) ele.classList.remove(oldName);
}

function update()
{
    let ele = inEle.get();
    let cn = inClassName.get();

    if (!inEle.isLinked()) remove(oldEle);

    if (!cn || !ele || !ele.classList) return;
    if (oldEle && ele != oldEle)oldEle.classList.remove(cn);
    remove(ele);

    if (!inActive.get()) ele.classList.remove(cn);
    else ele.classList.add(cn);

    oldName = cn;
    oldEle = ele;
}


};

Ops.Html.ToggleClass.prototype = new CABLES.Op();
CABLES.OPS["6dd90fb9-7f28-427f-acd8-589f21a906bb"]={f:Ops.Html.ToggleClass,objName:"Ops.Html.ToggleClass"};




// **************************************************************
// 
// Ops.Cables.UIMode
// 
// **************************************************************

Ops.Cables.UIMode = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    outUI = op.outBoolNum("UI", op.patch.isEditorMode()),
    outRemoteViewer = op.outBoolNum("Remote Viewer", window.gui ? window.gui.isRemoteClient : false),
    outCanvasMode = op.outNumber("Canvas Mode"),
    outPatchVisible = op.outBoolNum("Patch Field Visible");

if (CABLES.UI)
{
    gui.on("canvasModeChange", () =>
    {
        outCanvasMode.set(gui.getCanvasMode());
        outPatchVisible.set(gui.patchView.element.classList.contains("hidden"));
    });
}


};

Ops.Cables.UIMode.prototype = new CABLES.Op();
CABLES.OPS["7c110d60-829f-4b06-b3e4-0af911550570"]={f:Ops.Cables.UIMode,objName:"Ops.Cables.UIMode"};




// **************************************************************
// 
// Ops.Value.DelayedValue
// 
// **************************************************************

Ops.Value.DelayedValue = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe = op.inTrigger("Update"),
    v = op.inValue("Value", 0),
    delay = op.inValue("Delay", 0.5),
    result = op.outNumber("Result", 0),
    clear = op.inValueBool("Clear on Change", false);

const anim = new CABLES.Anim();
anim.createPort(op, "easing", function () {}).set("absolute");

exe.onTriggered = function ()
{
    result.set(anim.getValue(op.patch.freeTimer.get()) || 0);
};

v.onChange = function ()
{
    const current = anim.getValue(op.patch.freeTimer.get());
    const t = op.patch.freeTimer.get();

    if (clear.get()) anim.clear(t);

    anim.setValue(t + delay.get(), v.get());

    let lastKey = 0;
    for (let i = 0; i < anim.keys.length; i++)
        if (anim.keys[i] && anim.keys[i].time < t)lastKey = i;

    if (lastKey > 2) anim.keys.splice(0, lastKey);
};


};

Ops.Value.DelayedValue.prototype = new CABLES.Op();
CABLES.OPS["8e7741e0-0b1b-40f3-a62c-ac8a8828dffb"]={f:Ops.Value.DelayedValue,objName:"Ops.Value.DelayedValue"};




// **************************************************************
// 
// Ops.Value.TriggerOnChangeNumber
// 
// **************************************************************

Ops.Value.TriggerOnChangeNumber = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inval = op.inFloat("Value"),
    next = op.outTrigger("Next"),
    number = op.outNumber("Number");

inval.onChange = function ()
{
    number.set(inval.get());
    next.trigger();
};


};

Ops.Value.TriggerOnChangeNumber.prototype = new CABLES.Op();
CABLES.OPS["f5c8c433-ce13-49c4-9a33-74e98f110ed0"]={f:Ops.Value.TriggerOnChangeNumber,objName:"Ops.Value.TriggerOnChangeNumber"};




// **************************************************************
// 
// Ops.Vars.VarTriggerNumber
// 
// **************************************************************

Ops.Vars.VarTriggerNumber = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    trigger = op.inTriggerButton("Trigger"),
    val = op.inValueFloat("Value", 0),
    next = op.outTrigger("Next");

op.varName = op.inDropDown("Variable", [], "", true);

new CABLES.VarSetOpWrapper(op, "number", val, op.varName, trigger, next);


};

Ops.Vars.VarTriggerNumber.prototype = new CABLES.Op();
CABLES.OPS["2c29baf0-2af2-486d-9218-4299594ee9c1"]={f:Ops.Vars.VarTriggerNumber,objName:"Ops.Vars.VarTriggerNumber"};




// **************************************************************
// 
// Ops.String.Concat_v2
// 
// **************************************************************

Ops.String.Concat_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    string1 = op.inString("string1", "ABC"),
    string2 = op.inString("string2", "XYZ"),
    newLine = op.inValueBool("New Line", false),
    active = op.inBool("Active", true),
    result = op.outString("result");

newLine.onChange =
    string2.onChange =
    string1.onChange =
    active.onChange = exec;

exec();

function exec()
{
    if (!active.get())
    {
        return result.set(string1.get());
    }
    let s1 = string1.get();
    let s2 = string2.get();
    if (!s1 && !s2)
    {
        result.set("");
        return;
    }
    if (!s1)s1 = "";
    if (!s2)s2 = "";

    let nl = "";
    if (s1 && s2 && newLine.get())nl = "\n";
    result.set(String(s1) + nl + String(s2));
}


};

Ops.String.Concat_v2.prototype = new CABLES.Op();
CABLES.OPS["a52722aa-0ca9-402c-a844-b7e98a6c6e60"]={f:Ops.String.Concat_v2,objName:"Ops.String.Concat_v2"};




// **************************************************************
// 
// Ops.String.SwitchString
// 
// **************************************************************

Ops.String.SwitchString = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    idx=op.inValueInt("Index"),
    result=op.outString("Result");

const valuePorts=[];

idx.onChange=update;

for(var i=0;i<10;i++)
{
    var p=op.inString("String "+i);
    valuePorts.push( p );
    p.onChange=update;
}

function update()
{
    if(idx.get()>=0 && valuePorts[idx.get()])
    {
        result.set( valuePorts[idx.get()].get() );
    }
}

};

Ops.String.SwitchString.prototype = new CABLES.Op();
CABLES.OPS["2a7a0c68-f7c9-4249-b19a-d2de5cb4862c"]={f:Ops.String.SwitchString,objName:"Ops.String.SwitchString"};




// **************************************************************
// 
// Ops.String.String_v2
// 
// **************************************************************

Ops.String.String_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    v=op.inString("value",""),
    result=op.outString("String");

v.onChange=function()
{
    result.set(v.get());
};



};

Ops.String.String_v2.prototype = new CABLES.Op();
CABLES.OPS["d697ff82-74fd-4f31-8f54-295bc64e713d"]={f:Ops.String.String_v2,objName:"Ops.String.String_v2"};




// **************************************************************
// 
// Ops.Math.GaussianRandomArray
// 
// **************************************************************

Ops.Math.GaussianRandomArray = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inNum = op.inValueInt("Num", 100),
    outArr = op.outArray("Array"),
    inDev = op.inValue("Deviation", 1),
    seed = op.inValueFloat("Random Seed");

let arr = [];
let stdDev = 1;
let previous = false;
let nextGaussian = null;
let y2;

seed.onChange = inDev.onChange = inNum.onChange = update;
update();

// from https://github.com/processing/p5.js/blob/master/src/math/random.js

function randomGaussian(mean, sd)
{
    let y1, x1, x2, w;
    if (previous)
    {
        y1 = y2;
        previous = false;
    }
    else
    {
        do
        {
            x1 = Math.seededRandom() * 2 - 1;
            x2 = Math.seededRandom() * 2 - 1;
            w = x1 * x1 + x2 * x2;
        } while (w >= 1);
        w = Math.sqrt((-2 * Math.log(w)) / w);
        y1 = x1 * w;
        y2 = x2 * w;
        previous = true;
    }

    let m = mean || 0;
    let s = sd || 1;
    return y1 * s + m;
}

function update()
{
    stdDev = inDev.get();
    Math.randomSeed = seed.get();

    arr.length = Math.floor(inNum.get()) || 0;
    for (let i = 0; i < arr.length; i++)
    {
        arr[i] = randomGaussian(0, stdDev);
    }

    outArr.set(null);
    outArr.set(arr);
}


};

Ops.Math.GaussianRandomArray.prototype = new CABLES.Op();
CABLES.OPS["1a8c3535-6fce-4cba-8601-ddb7a5dd7656"]={f:Ops.Math.GaussianRandomArray,objName:"Ops.Math.GaussianRandomArray"};




// **************************************************************
// 
// Ops.Patch.Pw01AEC.AccumulatorPlain
// 
// **************************************************************

Ops.Patch.Pw01AEC.AccumulatorPlain = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    exe = op.inTrigger("Trigger in"),
    inAddNumber = op.inValueFloat("Add to number", 0.0),
    inMultiplier = op.inValueFloat("Multiplier to add number", 1.0),
    inSetNumber = op.inValueFloat("Default Value", 1.0),
    inSet = op.inTriggerButton("Set Default Value"),
    outNumber = op.outNumber("Current value");

//let lastTime = performance.now();
let currentNumber = 0.0;
let firsttime = true;

inSet.onTriggered = resetNumber;

function resetNumber()
{
    currentNumber = inSetNumber.get();
    outNumber.set(currentNumber);
    firsttime = true;
}

exe.onTriggered = function ()
{
    if (!firsttime)
    {
        //let diff = (performance.now() - lastTime) / 100;
        currentNumber += inAddNumber.get() * inMultiplier.get();
        outNumber.set(currentNumber);
    }
    //lastTime = performance.now();
    firsttime = false;
};


};

Ops.Patch.Pw01AEC.AccumulatorPlain.prototype = new CABLES.Op();
CABLES.OPS["7a2656ad-a91e-48ab-a140-0753e7186476"]={f:Ops.Patch.Pw01AEC.AccumulatorPlain,objName:"Ops.Patch.Pw01AEC.AccumulatorPlain"};




// **************************************************************
// 
// Ops.Math.Cosine
// 
// **************************************************************

Ops.Math.Cosine = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    value = op.inValue("Value"),
    phase = op.inValue("Phase", 0.0),
    mul = op.inValue("Frequency", 1.0),
    amplitude = op.inValue("Amplitude", 1.0),
    invert = op.inValueBool("asine", false),
    result = op.outNumber("Result");

let calculate = Math.cos;

value.onChange = function ()
{
    result.set(
        amplitude.get() * calculate((value.get() * mul.get()) + phase.get())
    );
};

invert.onChange = function ()
{
    if (invert.get()) calculate = Math.acos;
    else calculate = Math.cos;
};


};

Ops.Math.Cosine.prototype = new CABLES.Op();
CABLES.OPS["b51166c4-e0a8-441a-b724-1531effdc52f"]={f:Ops.Math.Cosine,objName:"Ops.Math.Cosine"};




// **************************************************************
// 
// Ops.Math.Pi
// 
// **************************************************************

Ops.Math.Pi = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    multiply = op.inValueFloat("Multiply amount", 1.0),
    p = op.outNumber("Pi", Math.PI);

multiply.onChange = function ()
{
    p.setValue(Math.PI * multiply.get());
};


};

Ops.Math.Pi.prototype = new CABLES.Op();
CABLES.OPS["311e8179-9a7c-43de-9eb2-84577d702974"]={f:Ops.Math.Pi,objName:"Ops.Math.Pi"};




// **************************************************************
// 
// Ops.Math.Abs
// 
// **************************************************************

Ops.Math.Abs = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    number = op.inValue("number"),
    result = op.outNumber("result");

number.onChange = function ()
{
    result.set(Math.abs(number.get()));
};


};

Ops.Math.Abs.prototype = new CABLES.Op();
CABLES.OPS["6b5af21d-065f-44d2-9442-8b7a254753f6"]={f:Ops.Math.Abs,objName:"Ops.Math.Abs"};




// **************************************************************
// 
// Ops.Math.RandomNumbers_v3
// 
// **************************************************************

Ops.Math.RandomNumbers_v3 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inSeed = op.inValueFloat("Seed", 1),
    min = op.inValueFloat("Min", 0),
    max = op.inValueFloat("Max", 1),
    outX = op.outNumber("X"),
    outY = op.outNumber("Y"),
    outZ = op.outNumber("Z"),
    outW = op.outNumber("W");

inSeed.onChange =
    min.onChange =
    max.onChange = update;
update();

function update()
{
    const inMin = min.get();
    const inMax = max.get();
    Math.randomSeed = Math.abs(inSeed.get() || 0) * 571.1 + 1.0;
    outX.set(Math.seededRandom() * (inMax - inMin) + inMin);
    outY.set(Math.seededRandom() * (inMax - inMin) + inMin);
    outZ.set(Math.seededRandom() * (inMax - inMin) + inMin);
    outW.set(Math.seededRandom() * (inMax - inMin) + inMin);
}


};

Ops.Math.RandomNumbers_v3.prototype = new CABLES.Op();
CABLES.OPS["d2b970e1-9406-4459-995c-5a594acd88e3"]={f:Ops.Math.RandomNumbers_v3,objName:"Ops.Math.RandomNumbers_v3"};




// **************************************************************
// 
// Ops.Gl.TextureEffects.Noise.PerlinNoise_v2
// 
// **************************************************************

Ops.Gl.TextureEffects.Noise.PerlinNoise_v2 = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={"perlinnoise3d_frag":"UNI float z;\nUNI float x;\nUNI float y;\nUNI float scale;\nUNI float rangeMul;\nUNI float harmonics;\nUNI float aspect;\n\nIN vec2 texCoord;\nUNI sampler2D tex;\n\n#ifdef HAS_TEX_OFFSETMAP\n    UNI sampler2D texOffsetZ;\n    UNI float offMul;\n#endif\n\n#ifdef HAS_TEX_MASK\n    UNI sampler2D texMask;\n#endif\n\nUNI float amount;\n\n{{CGL.BLENDMODES3}}\n\n\nfloat Interpolation_C2( float x ) { return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }   //  6x^5-15x^4+10x^3\t( Quintic Curve.  As used by Perlin in Improved Noise.  http://mrl.nyu.edu/~perlin/paper445.pdf )\nvec2 Interpolation_C2( vec2 x ) { return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }\nvec3 Interpolation_C2( vec3 x ) { return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }\nvec4 Interpolation_C2( vec4 x ) { return x * x * x * (x * (x * 6.0 - 15.0) + 10.0); }\nvec4 Interpolation_C2_InterpAndDeriv( vec2 x ) { return x.xyxy * x.xyxy * ( x.xyxy * ( x.xyxy * ( x.xyxy * vec2( 6.0, 0.0 ).xxyy + vec2( -15.0, 30.0 ).xxyy ) + vec2( 10.0, -60.0 ).xxyy ) + vec2( 0.0, 30.0 ).xxyy ); }\nvec3 Interpolation_C2_Deriv( vec3 x ) { return x * x * (x * (x * 30.0 - 60.0) + 30.0); }\n\n\nvoid FAST32_hash_3D( vec3 gridcell, out vec4 lowz_hash, out vec4 highz_hash )\t//\tgenerates a random number for each of the 8 cell corners\n{\n    //    gridcell is assumed to be an integer coordinate\n\n    //\tTODO: \tthese constants need tweaked to find the best possible noise.\n    //\t\t\tprobably requires some kind of brute force computational searching or something....\n    const vec2 OFFSET = vec2( 50.0, 161.0 );\n    const float DOMAIN = 69.0;\n    const float SOMELARGEFLOAT = 635.298681;\n    const float ZINC = 48.500388;\n\n    //\ttruncate the domain\n    gridcell.xyz = gridcell.xyz - floor(gridcell.xyz * ( 1.0 / DOMAIN )) * DOMAIN;\n    vec3 gridcell_inc1 = step( gridcell, vec3( DOMAIN - 1.5 ) ) * ( gridcell + 1.0 );\n\n    //\tcalculate the noise\n    vec4 P = vec4( gridcell.xy, gridcell_inc1.xy ) + OFFSET.xyxy;\n    P *= P;\n    P = P.xzxz * P.yyww;\n    highz_hash.xy = vec2( 1.0 / ( SOMELARGEFLOAT + vec2( gridcell.z, gridcell_inc1.z ) * ZINC ) );\n    lowz_hash = fract( P * highz_hash.xxxx );\n    highz_hash = fract( P * highz_hash.yyyy );\n}\n\n\n\n\nvoid FAST32_hash_3D( \tvec3 gridcell,\n                        out vec4 lowz_hash_0,\n                        out vec4 lowz_hash_1,\n                        out vec4 lowz_hash_2,\n                        out vec4 highz_hash_0,\n                        out vec4 highz_hash_1,\n                        out vec4 highz_hash_2\t)\t\t//\tgenerates 3 random numbers for each of the 8 cell corners\n{\n    //    gridcell is assumed to be an integer coordinate\n\n    //\tTODO: \tthese constants need tweaked to find the best possible noise.\n    //\t\t\tprobably requires some kind of brute force computational searching or something....\n    const vec2 OFFSET = vec2( 50.0, 161.0 );\n    const float DOMAIN = 69.0;\n    const vec3 SOMELARGEFLOATS = vec3( 635.298681, 682.357502, 668.926525 );\n    const vec3 ZINC = vec3( 48.500388, 65.294118, 63.934599 );\n\n    //\ttruncate the domain\n    gridcell.xyz = gridcell.xyz - floor(gridcell.xyz * ( 1.0 / DOMAIN )) * DOMAIN;\n    vec3 gridcell_inc1 = step( gridcell, vec3( DOMAIN - 1.5 ) ) * ( gridcell + 1.0 );\n\n    //\tcalculate the noise\n    vec4 P = vec4( gridcell.xy, gridcell_inc1.xy ) + OFFSET.xyxy;\n    P *= P;\n    P = P.xzxz * P.yyww;\n    vec3 lowz_mod = vec3( 1.0 / ( SOMELARGEFLOATS.xyz + gridcell.zzz * ZINC.xyz ) );\n    vec3 highz_mod = vec3( 1.0 / ( SOMELARGEFLOATS.xyz + gridcell_inc1.zzz * ZINC.xyz ) );\n    lowz_hash_0 = fract( P * lowz_mod.xxxx );\n    highz_hash_0 = fract( P * highz_mod.xxxx );\n    lowz_hash_1 = fract( P * lowz_mod.yyyy );\n    highz_hash_1 = fract( P * highz_mod.yyyy );\n    lowz_hash_2 = fract( P * lowz_mod.zzzz );\n    highz_hash_2 = fract( P * highz_mod.zzzz );\n}\nfloat Falloff_Xsq_C1( float xsq ) { xsq = 1.0 - xsq; return xsq*xsq; }\t// ( 1.0 - x*x )^2   ( Used by Humus for lighting falloff in Just Cause 2.  GPUPro 1 )\nfloat Falloff_Xsq_C2( float xsq ) { xsq = 1.0 - xsq; return xsq*xsq*xsq; }\t// ( 1.0 - x*x )^3.   NOTE: 2nd derivative is 0.0 at x=1.0, but non-zero at x=0.0\nvec4 Falloff_Xsq_C2( vec4 xsq ) { xsq = 1.0 - xsq; return xsq*xsq*xsq; }\n\n\n//\n//\tPerlin Noise 3D  ( gradient noise )\n//\tReturn value range of -1.0->1.0\n//\thttp://briansharpe.files.wordpress.com/2011/11/perlinsample.jpg\n//\nfloat Perlin3D( vec3 P )\n{\n    //\testablish our grid cell and unit position\n    vec3 Pi = floor(P);\n    vec3 Pf = P - Pi;\n    vec3 Pf_min1 = Pf - 1.0;\n\n#if 1\n    //\n    //\tclassic noise.\n    //\trequires 3 random values per point.  with an efficent hash function will run faster than improved noise\n    //\n\n    //\tcalculate the hash.\n    //\t( various hashing methods listed in order of speed )\n    vec4 hashx0, hashy0, hashz0, hashx1, hashy1, hashz1;\n    FAST32_hash_3D( Pi, hashx0, hashy0, hashz0, hashx1, hashy1, hashz1 );\n    //SGPP_hash_3D( Pi, hashx0, hashy0, hashz0, hashx1, hashy1, hashz1 );\n\n    //\tcalculate the gradients\n    vec4 grad_x0 = hashx0 - 0.49999;\n    vec4 grad_y0 = hashy0 - 0.49999;\n    vec4 grad_z0 = hashz0 - 0.49999;\n    vec4 grad_x1 = hashx1 - 0.49999;\n    vec4 grad_y1 = hashy1 - 0.49999;\n    vec4 grad_z1 = hashz1 - 0.49999;\n    vec4 grad_results_0 = inversesqrt( grad_x0 * grad_x0 + grad_y0 * grad_y0 + grad_z0 * grad_z0 ) * ( vec2( Pf.x, Pf_min1.x ).xyxy * grad_x0 + vec2( Pf.y, Pf_min1.y ).xxyy * grad_y0 + Pf.zzzz * grad_z0 );\n    vec4 grad_results_1 = inversesqrt( grad_x1 * grad_x1 + grad_y1 * grad_y1 + grad_z1 * grad_z1 ) * ( vec2( Pf.x, Pf_min1.x ).xyxy * grad_x1 + vec2( Pf.y, Pf_min1.y ).xxyy * grad_y1 + Pf_min1.zzzz * grad_z1 );\n\n#if 1\n    //\tClassic Perlin Interpolation\n    vec3 blend = Interpolation_C2( Pf );\n    vec4 res0 = mix( grad_results_0, grad_results_1, blend.z );\n    vec4 blend2 = vec4( blend.xy, vec2( 1.0 - blend.xy ) );\n    float final = dot( res0, blend2.zxzx * blend2.wwyy );\n    final *= 1.1547005383792515290182975610039;\t\t//\t(optionally) scale things to a strict -1.0->1.0 range    *= 1.0/sqrt(0.75)\n    return final;\n#else\n    //\tClassic Perlin Surflet\n    //\thttp://briansharpe.wordpress.com/2012/03/09/modifications-to-classic-perlin-noise/\n    Pf *= Pf;\n    Pf_min1 *= Pf_min1;\n    vec4 vecs_len_sq = vec4( Pf.x, Pf_min1.x, Pf.x, Pf_min1.x ) + vec4( Pf.yy, Pf_min1.yy );\n    float final = dot( Falloff_Xsq_C2( min( vec4( 1.0 ), vecs_len_sq + Pf.zzzz ) ), grad_results_0 ) + dot( Falloff_Xsq_C2( min( vec4( 1.0 ), vecs_len_sq + Pf_min1.zzzz ) ), grad_results_1 );\n    final *= 2.3703703703703703703703703703704;\t\t//\t(optionally) scale things to a strict -1.0->1.0 range    *= 1.0/cube(0.75)\n    return final;\n#endif\n\n#else\n    //\n    //\timproved noise.\n    //\trequires 1 random value per point.  Will run faster than classic noise if a slow hashing function is used\n    //\n\n    //\tcalculate the hash.\n    //\t( various hashing methods listed in order of speed )\n    vec4 hash_lowz, hash_highz;\n    FAST32_hash_3D( Pi, hash_lowz, hash_highz );\n    //BBS_hash_3D( Pi, hash_lowz, hash_highz );\n    //SGPP_hash_3D( Pi, hash_lowz, hash_highz );\n\n    //\n    //\t\"improved\" noise using 8 corner gradients.  Faster than the 12 mid-edge point method.\n    //\tKen mentions using diagonals like this can cause \"clumping\", but we'll live with that.\n    //\t[1,1,1]  [-1,1,1]  [1,-1,1]  [-1,-1,1]\n    //\t[1,1,-1] [-1,1,-1] [1,-1,-1] [-1,-1,-1]\n    //\n    hash_lowz -= 0.5;\n    vec4 grad_results_0_0 = vec2( Pf.x, Pf_min1.x ).xyxy * sign( hash_lowz );\n    hash_lowz = abs( hash_lowz ) - 0.25;\n    vec4 grad_results_0_1 = vec2( Pf.y, Pf_min1.y ).xxyy * sign( hash_lowz );\n    vec4 grad_results_0_2 = Pf.zzzz * sign( abs( hash_lowz ) - 0.125 );\n    vec4 grad_results_0 = grad_results_0_0 + grad_results_0_1 + grad_results_0_2;\n\n    hash_highz -= 0.5;\n    vec4 grad_results_1_0 = vec2( Pf.x, Pf_min1.x ).xyxy * sign( hash_highz );\n    hash_highz = abs( hash_highz ) - 0.25;\n    vec4 grad_results_1_1 = vec2( Pf.y, Pf_min1.y ).xxyy * sign( hash_highz );\n    vec4 grad_results_1_2 = Pf_min1.zzzz * sign( abs( hash_highz ) - 0.125 );\n    vec4 grad_results_1 = grad_results_1_0 + grad_results_1_1 + grad_results_1_2;\n\n    //\tblend the gradients and return\n    vec3 blend = Interpolation_C2( Pf );\n    vec4 res0 = mix( grad_results_0, grad_results_1, blend.z );\n    vec4 blend2 = vec4( blend.xy, vec2( 1.0 - blend.xy ) );\n    return dot( res0, blend2.zxzx * blend2.wwyy ) * (2.0 / 3.0);\t//\t(optionally) mult by (2.0/3.0) to scale to a strict -1.0->1.0 range\n#endif\n}\n\nvoid main()\n{\n    vec4 base=texture(tex,texCoord);\n    vec2 p=vec2(texCoord.x-0.5,texCoord.y-0.5);\n\n    p=p*scale;\n    p=vec2(p.x+0.5-x,p.y+0.5-y);\n\n\n\n    vec3 offset;\n    #ifdef HAS_TEX_OFFSETMAP\n        vec4 offMap=texture(texOffsetZ,texCoord);\n\n        #ifdef OFFSET_X_R\n            offset.x=offMap.r;\n        #endif\n        #ifdef OFFSET_X_G\n            offset.x=offMap.g;\n        #endif\n        #ifdef OFFSET_X_B\n            offset.x=offMap.b;\n        #endif\n\n        #ifdef OFFSET_Y_R\n            offset.y=offMap.r;\n        #endif\n        #ifdef OFFSET_Y_G\n            offset.y=offMap.g;\n        #endif\n        #ifdef OFFSET_Y_B\n            offset.y=offMap.b;\n        #endif\n\n        #ifdef OFFSET_Z_R\n            offset.z=offMap.r;\n        #endif\n        #ifdef OFFSET_Z_G\n            offset.z=offMap.g;\n        #endif\n        #ifdef OFFSET_Z_B\n            offset.z=offMap.b;\n        #endif\n        offset*=offMul;\n    #endif\n\n    float aa=texture(tex,texCoord).r;\n\n    float v = 0.0;\n    p.x*=aspect;\n\n    v+=Perlin3D(vec3(p.x,p.y,z)+offset);\n\n    #ifdef HARMONICS\n        if (harmonics >= 2.0) v += Perlin3D(vec3(p.x,p.y,z)*2.2+offset) * 0.5;\n        if (harmonics >= 3.0) v += Perlin3D(vec3(p.x,p.y,z)*4.3+offset) * 0.25;\n        if (harmonics >= 4.0) v += Perlin3D(vec3(p.x,p.y,z)*8.4+offset) * 0.125;\n        if (harmonics >= 5.0) v += Perlin3D(vec3(p.x,p.y,z)*16.5+offset) * 0.0625;\n    #endif\n\n\n    v*=rangeMul;\n    v=v*0.5+0.5;\n    float v2=v;\n    float v3=v;\n\n    #ifdef RGB\n        v2=Perlin3D(vec3(p.x+2.0,p.y+2.0,z))*0.5+0.5;\n\n        #ifdef HARMONICS\n            if (harmonics >= 2.0) v2 += Perlin3D(vec3(p.x,p.y,z)*2.2+offset) * 0.5;\n            if (harmonics >= 3.0) v2 += Perlin3D(vec3(p.x,p.y,z)*4.3+offset) * 0.25;\n            if (harmonics >= 4.0) v2 += Perlin3D(vec3(p.x,p.y,z)*8.4+offset) * 0.125;\n            if (harmonics >= 5.0) v2 += Perlin3D(vec3(p.x,p.y,z)*16.5+offset) * 0.0625;\n        #endif\n\n        v3=Perlin3D(vec3(p.x+3.0,p.y+3.0,z))*0.5+0.5;\n\n        #ifdef HARMONICS\n            if (harmonics >= 2.0) v3 += Perlin3D(vec3(p.x,p.y,z)*2.2+offset) * 0.5;\n            if (harmonics >= 3.0) v3 += Perlin3D(vec3(p.x,p.y,z)*4.3+offset) * 0.25;\n            if (harmonics >= 4.0) v3 += Perlin3D(vec3(p.x,p.y,z)*8.4+offset) * 0.125;\n            if (harmonics >= 5.0) v3 += Perlin3D(vec3(p.x,p.y,z)*16.5+offset) * 0.0625;\n        #endif\n\n    #endif\n\n    vec4 col=vec4(v,v2,v3,1.0);\n\n    float str=1.0;\n    #ifdef HAS_TEX_MASK\n        str=texture(texMask,texCoord).r;\n    #endif\n\n    col=cgl_blendPixel(base,col,amount*str);\n\n\n    #ifdef NO_CHANNEL_R\n        col.r=base.r;\n    #endif\n    #ifdef NO_CHANNEL_G\n        col.g=base.g;\n    #endif\n    #ifdef NO_CHANNEL_B\n        col.b=base.b;\n    #endif\n\n\n\n    outColor=col;\n}\n",};
const
    render = op.inTrigger("render"),
    inTexMask = op.inTexture("Mask"),
    blendMode = CGL.TextureEffect.AddBlendSelect(op),
    maskAlpha = CGL.TextureEffect.AddBlendAlphaMask(op),
    amount = op.inValueSlider("Amount", 1),
    inMode = op.inSwitch("Color", ["Mono", "RGB", "R", "G", "B"], "Mono"),
    scale = op.inValue("Scale", 8),
    rangeMul = op.inValue("Multiply", 1),
    inHarmonics = op.inSwitch("Harmonics", ["1", "2", "3", "4", "5"], "1"),
    x = op.inValue("X", 0),
    y = op.inValue("Y", 0),
    z = op.inValue("Z", 0),
    trigger = op.outTrigger("trigger");

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, "perlinnoise");

op.setPortGroup("Position", [x, y, z]);

shader.setSource(shader.getDefaultVertexShader(), attachments.perlinnoise3d_frag);

const
    textureUniform = new CGL.Uniform(shader, "t", "tex", 0),
    textureUniformOffZ = new CGL.Uniform(shader, "t", "texOffsetZ", 1),
    textureUniformMask = new CGL.Uniform(shader, "t", "texMask", 2),

    uniZ = new CGL.Uniform(shader, "f", "z", z),
    uniX = new CGL.Uniform(shader, "f", "x", x),
    uniY = new CGL.Uniform(shader, "f", "y", y),
    uniScale = new CGL.Uniform(shader, "f", "scale", scale),
    amountUniform = new CGL.Uniform(shader, "f", "amount", amount),
    rangeMulUniform = new CGL.Uniform(shader, "f", "rangeMul", rangeMul);

CGL.TextureEffect.setupBlending(op, shader, blendMode, amount, maskAlpha);

// offsetMap

const
    inTexOffsetZ = op.inTexture("Offset"),
    inOffsetMul = op.inFloat("Offset Multiply", 1),
    offsetX = op.inSwitch("Offset X", ["None", "R", "G", "B"], "None"),
    offsetY = op.inSwitch("Offset Y", ["None", "R", "G", "B"], "None"),
    offsetZ = op.inSwitch("Offset Z", ["None", "R", "G", "B"], "R");

op.setPortGroup("Offset Map", [inTexOffsetZ, offsetZ, offsetY, offsetX, inOffsetMul]);

const uniOffMul = new CGL.Uniform(shader, "f", "offMul", inOffsetMul);

const uniAspect = new CGL.Uniform(shader, "f", "aspect", 1);
const uniHarmonics = new CGL.Uniform(shader, "f", "harmonics", 0);

inHarmonics.onChange = () =>
{
    uniHarmonics.setValue(parseFloat(inHarmonics.get()));
    shader.toggleDefine("HARMONICS", inHarmonics.get() > 1);
};

offsetX.onChange =
offsetY.onChange =
offsetZ.onChange =
inTexMask.onChange =
inMode.onChange =
inTexOffsetZ.onChange = updateDefines;
updateDefines();

function updateDefines()
{
    shader.toggleDefine("NO_CHANNEL_R", inMode.get() == "G" || inMode.get() == "B");
    shader.toggleDefine("NO_CHANNEL_G", inMode.get() == "R" || inMode.get() == "B");
    shader.toggleDefine("NO_CHANNEL_B", inMode.get() == "R" || inMode.get() == "G");

    shader.toggleDefine("HAS_TEX_OFFSETMAP", inTexOffsetZ.get());
    shader.toggleDefine("HAS_TEX_MASK", inTexMask.get());

    shader.toggleDefine("OFFSET_X_R", offsetX.get() == "R");
    shader.toggleDefine("OFFSET_X_G", offsetX.get() == "G");
    shader.toggleDefine("OFFSET_X_B", offsetX.get() == "B");

    shader.toggleDefine("OFFSET_Y_R", offsetY.get() == "R");
    shader.toggleDefine("OFFSET_Y_G", offsetY.get() == "G");
    shader.toggleDefine("OFFSET_Y_B", offsetY.get() == "B");

    shader.toggleDefine("OFFSET_Z_R", offsetZ.get() == "R");
    shader.toggleDefine("OFFSET_Z_G", offsetZ.get() == "G");
    shader.toggleDefine("OFFSET_Z_B", offsetZ.get() == "B");

    offsetX.setUiAttribs({ "greyout": !inTexOffsetZ.isLinked() });
    offsetY.setUiAttribs({ "greyout": !inTexOffsetZ.isLinked() });
    offsetZ.setUiAttribs({ "greyout": !inTexOffsetZ.isLinked() });
    inOffsetMul.setUiAttribs({ "greyout": !inTexOffsetZ.isLinked() });

    shader.toggleDefine("RGB", inMode.get() == "RGB");
}

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op, 3)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    uniAspect.setValue(cgl.currentTextureEffect.aspectRatio);

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);
    if (inTexOffsetZ.get()) cgl.setTexture(1, inTexOffsetZ.get().tex);
    if (inTexMask.get()) cgl.setTexture(2, inTexMask.get().tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};


};

Ops.Gl.TextureEffects.Noise.PerlinNoise_v2.prototype = new CABLES.Op();
CABLES.OPS["b4b238d3-db68-4206-8dc7-4b52433fc932"]={f:Ops.Gl.TextureEffects.Noise.PerlinNoise_v2,objName:"Ops.Gl.TextureEffects.Noise.PerlinNoise_v2"};




// **************************************************************
// 
// Ops.Value.Boolean
// 
// **************************************************************

Ops.Value.Boolean = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    v = op.inValueBool("value", false),
    result = op.outBoolNum("result");

result.set(false);
v.onChange = exec;

function exec()
{
    if (result.get() != v.get()) result.set(v.get());
}


};

Ops.Value.Boolean.prototype = new CABLES.Op();
CABLES.OPS["83e2d74c-9741-41aa-a4d7-1bda4ef55fb3"]={f:Ops.Value.Boolean,objName:"Ops.Value.Boolean"};




// **************************************************************
// 
// Ops.Value.MaximumSafeInteger
// 
// **************************************************************

Ops.Value.MaximumSafeInteger = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
op.outNumber("Max Int", Number.MAX_SAFE_INTEGER);


};

Ops.Value.MaximumSafeInteger.prototype = new CABLES.Op();
CABLES.OPS["0efefbb7-461c-4a34-b7fd-28b89b0ceb3f"]={f:Ops.Value.MaximumSafeInteger,objName:"Ops.Value.MaximumSafeInteger"};




// **************************************************************
// 
// Ops.String.FreezeString
// 
// **************************************************************

Ops.String.FreezeString = function()
{
CABLES.Op.apply(this,arguments);
const op=this;
const attachments={};
const
    inStr = op.inString("String", "default"),
    inFreeze = op.inTriggerButton("Button"),
    inHidden = op.inString("StoredString"),
    outString = op.outString("Frozen String");

inFreeze.onTriggered =
inHidden.onTriggered = update;

inHidden.setUiAttribs({ "hideParam": true, "hidePort": true, "ignoreBigPort": true });

outString.onLinkChanged = () =>
{
    outString.set(inHidden.get());
};

function update()
{
    inHidden.set(inStr.get());
    outString.set(inHidden.get());
}


};

Ops.String.FreezeString.prototype = new CABLES.Op();
CABLES.OPS["9ae2598f-8b5a-4749-aff3-a507c9957225"]={f:Ops.String.FreezeString,objName:"Ops.String.FreezeString"};



window.addEventListener('load', function(event) {
CABLES.jsLoaded=new Event('CABLES.jsLoaded');
document.dispatchEvent(CABLES.jsLoaded);
});
