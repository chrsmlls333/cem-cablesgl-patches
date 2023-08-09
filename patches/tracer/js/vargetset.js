(()=>{"use strict";const t=0,e=2,i=2,s=3,a=5;CABLES.VarSetOpWrapper=class{constructor(r,h,_,o,n,p){this._valuePort=_,this._varNamePort=o,this._op=r,this._type=h,this._typeId=-1,this._triggerPort=n,this._nextPort=p,this._btnCreate=r.inTriggerButton("Create new variable"),this._btnCreate.setUiAttribs({hidePort:!0}),this._btnCreate.onTriggered=this._createVar.bind(this),this._helper=r.inUiTriggerButtons("",["Rename"]),this._helper.setUiAttribs({hidePort:!0}),this._helper.onTriggered=t=>{"Rename"==t&&CABLES.CMD.PATCH.renameVariable(r.varName.get())},this._op.setPortGroup("Variable",[this._helper,this._varNamePort,this._btnCreate]),this._op.on("uiParamPanel",this._updateVarNamesDropdown.bind(this)),this._op.patch.addEventListener("variablesChanged",this._updateName.bind(this)),this._op.patch.addEventListener("variableRename",this._renameVar.bind(this)),this._varNamePort.onChange=this._updateName.bind(this),this._isTexture="texture"===this._valuePort.uiAttribs.objType,this._valuePort.changeAlways=!0,this._triggerPort?this._triggerPort.onTriggered=()=>{this._setVarValue(!0)}:this._valuePort.onChange=this._setVarValue.bind(this),this._op.init=()=>{this._updateName(),this._triggerPort||this._setVarValue(),this._updateErrorUi()},this._typeId="array"==h?s:"object"==h?e:"string"==h?a:"texture"==h?i:t}_updateErrorUi(){CABLES.UI&&(this._varNamePort.get()?this._op.hasUiErrors&&this._op.setUiError("novarname",null):this._op.setUiError("novarname","no variable selected"))}_updateName(){const t=this._varNamePort.get();this._op.setTitle("var set "),this._op.setUiAttrib({extendTitle:"#"+t}),this._updateErrorUi();const e=this._op.patch.getVar(t);e&&!e.type&&(e.type=this._type),this._op.patch.hasVar(t)||0==t||this._triggerPort||this._setVarValue(),!this._op.patch.hasVar(t)&&0!=t&&this._triggerPort&&("string"==this._type||"number"==this._type?this._op.patch.setVarValue(t,""):this._op.patch.setVarValue(t,null)),this._op.isCurrentUiOp()&&(this._updateVarNamesDropdown(),this._op.refreshParams()),this._updateDisplay(),this._op.patch.emitEvent("opVariableNameChanged",this._op,this._varNamePort.get())}_createVar(){CABLES.CMD.PATCH.createVariable(this._op,this._type,(()=>{this._updateName()}))}_updateDisplay(){this._valuePort.setUiAttribs({greyout:!this._varNamePort.get()})}_updateVarNamesDropdown(){if(CABLES.UI&&CABLES.UI.loaded&&CABLES.UI.loaded){const t=[],e=this._op.patch.getVars();for(const i in e)e[i].type==this._type&&"0"!=i&&t.push(i);this._varNamePort.uiAttribs.values=t}}_renameVar(t,e){t==this._varNamePort.get()&&(this._varNamePort.set(e),this._updateName())}_setVarValue(i){const r=this._varNamePort.get();if(!r)return;const h=this._valuePort.get();this._typeId==t||this._typeId==a?this._op.patch.setVarValue(r,h):this._typeId==s?(this._arr=[],CABLES.copyArray(h,this._arr),this._op.patch.setVarValue(r,this._arr)):(this._typeId==e&&(this._isTexture?this._op.patch.setVarValue(r,CGL.Texture.getEmptyTexture(this._op.patch.cgl)):this._op.patch.setVarValue(r,null),h&&h.tex&&h._cgl&&!this._isTexture?this._op.setUiError("texobj","Dont use object variables for textures, use varSetTexture"):this._op.setUiError("texobj",null)),this._op.patch.setVarValue(r,h)),i&&this._nextPort&&this._nextPort.trigger()}},CABLES.VarGetOpWrapper=class{constructor(t,e,i,s){this._op=t,this._type=e,this._varnamePort=i,this._variable=null,this._valueOutPort=s,this._listenerId=null,this._op.on("uiParamPanel",this._updateVarNamesDropdown.bind(this)),this._op.on("uiErrorChange",this._updateTitle.bind(this)),this._op.patch.on("variableRename",this._renameVar.bind(this)),this._op.patch.on("variableDeleted",(t=>{this._op.isCurrentUiOp()&&this._op.refreshParams()})),this._varnamePort.onChange=this._changeVar.bind(this),this._op.patch.addEventListener("variablesChanged",this._init.bind(this)),this._op.onDelete=()=>{this._variable&&this._listenerId&&this._variable.off(this._listenerId)},this._op.init=()=>{this._init()}}get variable(){return this._variable}_changeVar(){this._variable&&this._listenerId&&this._variable.off(this._listenerId),this._init()}_renameVar(t,e){t==this._varnamePort.get()&&(this._varnamePort.set(e),this._updateVarNamesDropdown(),this._updateTitle(),this._listenerId=this._variable.on("change",this._setValueOut.bind(this)))}_updateVarNamesDropdown(){if(CABLES.UI&&CABLES.UI.loaded){const t=[],e=this._op.patch.getVars();for(const i in e)e[i].type==this._type&&"0"!=i&&t.push(i);this._op.varName.uiAttribs.values=t}}_setValueOut(t){this._valueOutPort&&this._valueOutPort.set(t)}_updateTitle(){this._variable?(this._op.setUiError("unknownvar",null),this._op.setTitle("var get "),this._op.setUiAttrib({extendTitle:"#"+this._varnamePort.get()}),this._valueOutPort&&this._valueOutPort.set(this._variable.getValue())):(this._op.setUiError("unknownvar","unknown variable! - there is no setVariable with this name ("+this._varnamePort.get()+")"),this._op.setUiAttrib({extendTitle:"#invalid"}),this._valueOutPort&&this._valueOutPort.set(0))}_init(){this._updateVarNamesDropdown(),this._variable&&this._listenerId&&this._variable.off(this._listenerId),this._variable=this._op.patch.getVar(this._op.varName.get()),this._variable&&(this._listenerId=this._variable.on("change",this._setValueOut.bind(this))),this._updateTitle(),this._op.patch.emitEvent("opVariableNameChanged",this._op,this._varnamePort.get())}},((this.CABLES=this.CABLES||{}).COREMODULES=this.CABLES.COREMODULES||{}).Vargetset={}.Cables})();