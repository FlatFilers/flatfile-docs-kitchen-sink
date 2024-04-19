import api from '@flatfile/api'
import { responseRejectionHandler } from '@flatfile/util-response-rejection'

export default function flatfileEventListener(listener) {
  listener.on(
    'job:ready',
    { job: 'workbook:submitActionFg' },
    async ({ context: { jobId, workbookId }, payload }) => {
      const { data: workbook } = await api.workbooks.get(workbookId)
      const { data: workbookSheets } = await api.sheets.list({ workbookId })

      const sheets = []
      for (const [_, element] of workbookSheets.entries()) {
        const { data: records } = await api.records.get(element.id)
        sheets.push({
          ...element,
          ...records,
        })
      }

      try {
        await api.jobs.ack(jobId, {
          info: 'Starting job to submit action to webhook.site',
          progress: 10,
        })

        const webhookReceiver =
          'http://localhost:5678/reject-non-flatfile-emails' // TODO: place your webhook url here

        const response = await fetch(webhookReceiver, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            workbook: {
              ...workbook,
              sheets,
            },
          }),
        })

        if (response.status === 200) {
          const responseData = await response.json()
          const rejections = responseData.rejections

          if (rejections) {
            const outcome = await responseRejectionHandler(rejections)
            return await api.jobs.complete(jobId, outcome)
          }
          return await api.jobs.complete(jobId, {
            outcome: {
              message: `Data was successfully submitted to webhook.site. Go check it out at ${webhookReceiver}.`,
            },
          })
        } else {
          throw new Error('Failed to submit data to webhook.site')
        }
      } catch (error) {
        console.error(error)
        await api.jobs.fail(jobId, {
          outcome: {
            message:
              "This job failed probably because it couldn't find the webhook.site URL.",
          },
        })
      }
    }
  )
}
