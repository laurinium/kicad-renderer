import {parse} from "kicad-to-json";
import {grArcToDxfArc, translatePoint} from "./utils";
import {DxfWriter, point3d} from "@tarikjabiri/dxf";
import * as makerjs from "makerjs";

export default class KicadPCBParser {
    constructor() {

    }

    parse(data: string) {
        let result: any = {};
        let res = parse.board(data, "long").kicad_pcb;
        for (let key in res) {
            if (result[res[key].type] === undefined) {
                result[res[key].type] = [];
            }
            result[res[key].type].push(res[key].value);
        }
        return result;
    }

    draw(data: any) {
        // Create a new model
        let model = new makerjs.models.ConnectTheDots(true, []);

        // Add layers
        for (let layer of data.layers[0]) {
            // In makerjs, layers are not explicitly added. They are inferred from the paths.
        }

        // Draw modules
        let i =0;
        for (let module of data.module) {
            this.drawModuleMakerjs(model, module, i);
            i++;
        }

        // Add lines
        i = 0;
        for (let line of data.gr_line) {
            let start = [line.start.x*-1, line.start.y*-1];
            let end = [line.end.x*-1, line.end.y*-1];
            model.paths["gr_line"+i] = new makerjs.paths.Line(start, end);
            i++;
        }

        i = 0;
        for (let arc of data.gr_arc) {
            let arcData = grArcToDxfArc(arc.start, arc.end, arc.angle);
            model.paths["gr_arc"+i] = new makerjs.paths.Arc([arcData.centerX, arcData.centerY], arcData.radius, arcData.startAngle, arcData.endAngle);
            i++;
        }

        // Export to SVG
        return makerjs.exporter.toSVG(model,{strokeWidth: '0.3'});
    }

    private drawModuleMakerjs(model: makerjs.IModel, module: any, moduleIndex: number = 0) {
        let origins = module.filter((x: any) => x.type === "at");
        let origin = origins[0].value;
        origin.angle = origin.angle*-1;
        if (model.models === undefined) {
            model.models = {};
        }
        if (model.paths === undefined) {
            model.paths = {};
        }

        for(let i in module){
            switch (module[i].type) {
                case "fp_line":
                    let line = module[i].value;
                    let x1 = translatePoint(origin, line.start, origin.angle);
                    let x2 = translatePoint(origin, line.end, origin.angle);
                    model.paths[moduleIndex+"fp_line"+i] = new makerjs.paths.Line([x1.x, x1.y], [x2.x, x2.y]);
                    break;
                case "pad":
                    let pad = module[i].value;
                    switch (pad.pad_shape) {
                        case "rect":
                            let x1 = translatePoint(origin, {x: pad.at.x - pad.size.width / 2, y: pad.at.y - pad.size.height / 2}, origin.angle);
                            let x2 = translatePoint(origin, {x: pad.at.x + pad.size.width / 2, y: pad.at.y + pad.size.height / 2}, origin.angle);
                            model.models[moduleIndex+"fp_pad_rect"+i] = new makerjs.models.Rectangle(x2.x - x1.x, x2.y - x1.y,);
                            model.models[moduleIndex+"fp_pad_rect"+i].exporterOptions = {toSVG: {fill: 'black', stroke: 'black', strokeWidth: '0.5'}};
                            makerjs.model.move(model.models[moduleIndex+"fp_pad_rect"+i], [x1.x, x1.y]);
                            break;
                        case "circle":
                            let x = translatePoint(origin, pad.at, origin.angle);
                            model.paths[moduleIndex+"fp_pad_circle"+i] = new makerjs.paths.Circle([x.x,x.y], pad.size.width / 2);
                            break;
                    }
                    break;
                case "fp_text":
                    let text = module[i].value;
                    let font = Font
                    model.models[moduleIndex+"fp_text"+i] = new makerjs.models.Text(font, text.text, 12);
                    break;
            }
        }
    }
    private drawModule(dxf: DxfWriter, module: any) {
        dxf.setCurrentLayerName("F.SilkS");
        let origins = module.filter((x: any) => x.type === "at");
        let origin = origins[0].value;
        origin.angle = origin.angle*-1
        for(let i in module){
            switch (module[i].type) {
                case "fp_line":
                    let line = module[i].value;
                    let x1 = translatePoint(origin, line.start, origin.angle);
                    let x2 = translatePoint(origin, line.end, origin.angle);
                    dxf.addLine(point3d(x1.x, x1.y), point3d(x2.x, x2.y));
                    break;
                case "pad":
                    let pad = module[i].value;
                    switch (pad.pad_shape) {
                        case "rect":
                            let x1 = translatePoint(origin, {x: pad.at.x - pad.size.width / 2, y: pad.at.y - pad.size.height / 2}, origin.angle);
                            let x2 = translatePoint(origin, {x: pad.at.x + pad.size.width / 2, y: pad.at.y + pad.size.height / 2}, origin.angle);
                            dxf.addRectangle(point3d(x1.x, x1.y), point3d(x2.x, x2.y));
                            break;
                        case "circle":
                            let x = translatePoint(origin, pad.at, origin.angle);
                            let y = translatePoint(origin, {x: pad.at.x + pad.size.width / 2, y: pad.at.y}, origin.angle);
                            dxf.addCircle(point3d(x.x, x.y), pad.size.width / 2);
                            break;

                    }
                    break;
                case "fp_text":
                    let text = module[i].value;
                    let x = translatePoint(origin, text.at, origin.angle);
                    dxf.addText(point3d(x.x,x.y),text.effects.font.size.height,text.text);
                    break;
            }
        }
    }


}