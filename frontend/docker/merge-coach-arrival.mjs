import fs from "node:fs";

const deliveryPath = "src/routes/delivery.js";
let source = fs.readFileSync(deliveryPath, "utf8");

const oldCoachPresentation = `        if (isCoach && (event.type === "job.started" || event.type === "job.delivered" || event.meta?.at_stop === true)) {
            const name = event.type === "job.started" ? tr("job_started") : event.type === "job.delivered" ? tr("job_delivered") : tr("coach_stop");
            return { icon: <DepartureBoardRounded />, color: "lightblue", name };
        }`;
const newCoachPresentation = `        if (isCoach && (event.type === "job.started" || event.type === "job.delivered" || event.type === "job.cancelled" || event.meta?.at_stop === true)) {
            const isDeparture = event.type === "job.started" || event.meta?.coach_stop?.role === "departure";
            const isArrival = event.type === "job.delivered" || event.meta?.coach_stop?.role === "destination";
            const name = isDeparture ? tr("coach_departure") : isArrival ? tr("coach_arrival") : event.type === "job.cancelled" ? tr("job_cancelled") : tr("coach_stop");
            const color = event.type === "job.cancelled" ? "lightred" : isDeparture || isArrival ? "lightgreen" : "lightblue";
            return { icon: <DepartureBoardRounded />, color, name };
        }`;
const filteredTimeline = 'dlogDetail.events.filter((event) => !(dlogDetail.bus !== undefined && event.type === "job.delivered" && dlogDetail.events.some((item) => item.meta?.at_stop === true))).map';
const completeTimeline = "dlogDetail.events.map";

if (source.includes(oldCoachPresentation)) {
    source = source.replace(oldCoachPresentation, newCoachPresentation);
} else if (!source.includes(newCoachPresentation)) {
    throw new Error("Unsupported Coach event presentation implementation.");
}

source = source.replace(filteredTimeline, completeTimeline);
fs.writeFileSync(deliveryPath, source);

const translations = {
    de: { coach_departure: "Abfahrt", coach_stop: "Zwischenhalt", coach_arrival: "Ankunft" },
    en: { coach_departure: "Departure", coach_stop: "Intermediate Stop", coach_arrival: "Arrival" },
    es: { coach_departure: "Salida", coach_stop: "Parada intermedia", coach_arrival: "Llegada" },
    nl: { coach_departure: "Vertrek", coach_stop: "Tussenstop", coach_arrival: "Aankomst" },
    pt: { coach_departure: "Partida", coach_stop: "Paragem intermédia", coach_arrival: "Chegada" },
};
for (const [language, labels] of Object.entries(translations)) {
    const path = `src/languages/${language}.json`;
    const data = JSON.parse(fs.readFileSync(path, "utf8"));
    Object.assign(data, labels);
    fs.writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}
