import { TEAMMATE_SPECIALIZATIONS, type TeammateSpecialization } from "./constants";

/** @deprecated Legacy helper; live sessions use `lib/interview-blueprint` for scenario data. */
export function getTeammateMeta(specialization: TeammateSpecialization) {
  return (
    TEAMMATE_SPECIALIZATIONS.find((entry) => entry.value === specialization) ??
    TEAMMATE_SPECIALIZATIONS[0]
  );
}
