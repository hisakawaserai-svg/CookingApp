import { Step } from '../types/recipe'

export const getTotalTime = (prepSteps: Step[], cookSteps: Step[]) => {
    const prep = prepSteps.reduce((sum, step) => sum + (step.timer ?? 0), 0)
    const cook = cookSteps.reduce((sum, step) => sum + (step.timer ?? 0), 0)
    return prep + cook
}