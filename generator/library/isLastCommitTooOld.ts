export function isLastCommitTooOld() {
	let lastCommitDate = new Date(process.env.LAST_COMMIT_DATE ?? Date.now())
	let now = new Date()
	let diffInDays = (now.getTime() - lastCommitDate.getTime()) / (1000 * 3600 * 24)
	return diffInDays > 365
}