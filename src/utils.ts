export function convertKicadToDXFArch(start:any, end:any, angle:number) {
        // Step 1: Calculate the chord length AB
        const AB = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));

        // Step 2: Calculate the radius R
        const R = AB / (2 * Math.sin(angle / 2));

        // Step 3: Calculate the midpoint M of the chord AB
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        // Step 4: Calculate the distance d from the midpoint M to the center C
        const d = Math.sqrt(Math.pow(R, 2) - Math.pow(AB / 2, 2));

        // Step 5: Calculate the perpendicular direction vectors
        const perpX1 = -(end.y - start.y);
        const perpY1 = end.x - start.x;
        const perpX2 = end.y - start.y;
        const perpY2 = -(end.x - start.x);

        // Normalize the perpendicular direction vectors
        const length = Math.sqrt(perpX1 * perpX1 + perpY1 * perpY1);
        const unitPerpX1 = perpX1 / length;
        const unitPerpY1 = perpY1 / length;
        const unitPerpX2 = perpX2 / length;
        const unitPerpY2 = perpY2 / length;

        // Step 6: Calculate the center coordinates C
        const centerX1 = midX + d * unitPerpX1;
        const centerY1 = midY + d * unitPerpY1;
        const centerX2 = midX + d * unitPerpX2;
        const centerY2 = midY + d * unitPerpY2;

        // Depending on the arc's direction (clockwise or counterclockwise), you need to choose the correct center
        // Here, we return both possible centers. You will need to determine which one is correct based on additional context.
        return {
            radius: R,
            possibleCenters: [
                { x: centerX1, y: centerY1 },
                { x: centerX2, y: centerY2 }
            ]
        };
}

export function translatePoint(origin:any, point:any, angleDegrees:number) {
    const angleRadians = angleDegrees * (Math.PI / 180);
    // Step 2: Translate point to origin
    const xPrime = point.x;
    const yPrime = point.y;
    // Step 3: Rotate point
    const xDoublePrime = xPrime * Math.cos(angleRadians) - yPrime * Math.sin(angleRadians);
    const yDoublePrime = xPrime * Math.sin(angleRadians) + yPrime * Math.cos(angleRadians);
    // Step 4: Translate point back
    const xNew = xDoublePrime + origin.x;
    const yNew = yDoublePrime + origin.y;
    return { x: xNew*-1, y: yNew*-1 };
}

function degrees(radians:number = 0) {
    return radians * (180 / Math.PI);
}

function calculateCenterAndRadius(start:any, end:any, angle:number) {
    const angleRadians = angle * (Math.PI / 180);
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const radius = distance / (2 * Math.sin(angleRadians / 2));

    const offsetAngle = Math.atan2(dy, dx) - Math.PI / 2 + angleRadians / 2;
    const centerX = midX + radius * Math.cos(offsetAngle);
    const centerY = midY + radius * Math.sin(offsetAngle);

    return {
        centerX,
        centerY,
        radius
    };
}

export function grArcToDxfArc(start:any, end:any, angle:number) {
    const { centerX, centerY, radius } = calculateCenterAndRadius(start, end, angle);

    const startAngle = degrees(Math.atan2(start.y - centerY, start.x - centerX));
    const endAngle = degrees(Math.atan2(end.y - centerY, end.x - centerX));

    return {
        centerX,
        centerY,
        radius,
        startAngle,
        endAngle
    };
}