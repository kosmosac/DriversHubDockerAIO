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
const emptyDescription = "                                                let desc = null;";
const coachStopDescription = `                                                let desc = null;
                                                if (dlogDetail.bus !== undefined && (e.type === "job.started" || e.type === "job.delivered" || e.type === "job.cancelled" || e.meta?.at_stop === true)) {
                                                    const segmentPassengers = e.meta?.coach_stop?.passengers ?? e.meta?.passengers;
                                                    const stopName = e.meta?.coach_stop?.name ?? e.meta?.name ?? e.meta?.city?.name;
                                                    let passengersIn = e.meta?.passengers_in;
                                                    let passengersOut = e.meta?.passengers_out;
                                                    if (segmentPassengers != null) {
                                                        const isDeparture = e.type === "job.started" || e.meta?.coach_stop?.role === "departure";
                                                        const isArrival = e.type === "job.delivered" || e.meta?.coach_stop?.role === "destination";
                                                        if (isDeparture) {
                                                            passengersIn = segmentPassengers.entering_actual ?? segmentPassengers.entering_planned;
                                                        } else if (isArrival) {
                                                            passengersOut = segmentPassengers.leaving_actual ?? segmentPassengers.leaving_planned;
                                                        } else {
                                                            passengersOut = segmentPassengers.leaving_actual ?? segmentPassengers.leaving_planned;
                                                            const followingSegmentEvent = dlogDetail.events.slice(idx + 1).find((item) => item.meta?.coach_stop?.passengers !== undefined || item.meta?.passengers !== undefined);
                                                            const followingSegmentPassengers = followingSegmentEvent?.meta?.coach_stop?.passengers ?? followingSegmentEvent?.meta?.passengers;
                                                            passengersIn = followingSegmentPassengers?.entering_actual ?? followingSegmentPassengers?.entering_planned;
                                                        }
                                                    }
                                                    const hasPassengersIn = passengersIn !== undefined && passengersIn !== null && Number.isFinite(Number(passengersIn));
                                                    const hasPassengersOut = passengersOut !== undefined && passengersOut !== null && Number.isFinite(Number(passengersOut));
                                                    if (stopName || hasPassengersIn || hasPassengersOut) desc = (
                                                        <>
                                                            {stopName}
                                                            {stopName && (hasPassengersIn || hasPassengersOut) && <br />}
                                                            {hasPassengersIn && <>{tr("passengers_boarded")}: {passengersIn}</>}
                                                            {hasPassengersIn && hasPassengersOut && <> · </>}
                                                            {hasPassengersOut && <>{tr("passengers_alighted")}: {passengersOut}</>}
                                                        </>
                                                    );
                                                }`;

if (source.includes(oldCoachPresentation)) {
    source = source.replace(oldCoachPresentation, newCoachPresentation);
} else if (!source.includes(newCoachPresentation)) {
    throw new Error("Unsupported Coach event presentation implementation.");
}

source = source.replace(filteredTimeline, completeTimeline);
if (source.includes(emptyDescription) && !source.includes("const segmentPassengers =")) {
    source = source.replace(emptyDescription, coachStopDescription);
} else if (!source.includes("const segmentPassengers =")) {
    throw new Error("Unsupported delivery event description implementation.");
}
fs.writeFileSync(deliveryPath, source);

const translations = {
    de: { coach_departure: "Abfahrt", coach_stop: "Zwischenhalt", coach_arrival: "Ankunft", passengers_boarded: "Eingestiegen", passengers_alighted: "Ausgestiegen" },
    en: { coach_departure: "Departure", coach_stop: "Intermediate Stop", coach_arrival: "Arrival", passengers_boarded: "Boarded", passengers_alighted: "Alighted" },
    es: { coach_departure: "Salida", coach_stop: "Parada intermedia", coach_arrival: "Llegada", passengers_boarded: "Subieron", passengers_alighted: "Bajaron" },
    nl: { coach_departure: "Vertrek", coach_stop: "Tussenstop", coach_arrival: "Aankomst", passengers_boarded: "Ingestapt", passengers_alighted: "Uitgestapt" },
    pt: { coach_departure: "Partida", coach_stop: "Paragem intermédia", coach_arrival: "Chegada", passengers_boarded: "Embarcaram", passengers_alighted: "Desembarcaram" },
};
for (const [language, labels] of Object.entries(translations)) {
    const path = `src/languages/${language}.json`;
    const data = JSON.parse(fs.readFileSync(path, "utf8"));
    Object.assign(data, labels);
    fs.writeFileSync(path, JSON.stringify(data, null, 2) + "\n");
}
