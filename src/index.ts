import { Client } from "@notionhq/client";
import { PageObjectResponse, PartialPageObjectResponse, QueryDatabaseParameters } from "@notionhq/client/build/src/api-endpoints";
import dotenv from "dotenv";

dotenv.config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const database_id = process.env.NOTION_DATABASE_ID;

async function tryUpdateDailyJournalIcon() {
  console.log("Looking for changes in Notion database ")
  //Get the tasks currently in the database
  const currTasksInDatabase = await getTasksFromDatabase()
  // console.log(currTasksInDatabase)

  //Iterate over the current tasks and compare them to tasks in our local store (tasksInDatabase)
  for (const p of currTasksInDatabase) {
    const page = p as PageObjectResponse
    if (page.icon === null) {
      const d = page.created_time.split("T")[0]
      await notion.pages.update({
        page_id: page.id,
        icon: {
          external: { url: `https://linmi.cc/calendar/index.php?date=${d}` },
          type: "external",
        }
      })
      console.log(`Page(${page.id}) icon is updated`)
    }
  }
  //Run this method every 5 seconds (5000 milliseconds)
  setTimeout(main, 5000)
}

//Get a paginated list of Tasks currently in a the database. 
async function getTasksFromDatabase() {

  let tasks: Array<PageObjectResponse | PartialPageObjectResponse> = []

  async function getPageOfTasks(cursor: string | null) {
    let req: QueryDatabaseParameters = {
      database_id: database_id!,
    }
    if (cursor !== null) {
      req.start_cursor = cursor!
    }

    let current_pages = await notion.databases.query(req)

    for (const page of current_pages.results) {
      tasks = tasks.concat(page)
    }
    if (current_pages.has_more) {
      await getPageOfTasks(current_pages.next_cursor)
    }
  }

  await getPageOfTasks(null);
  return tasks;
};

function main() {
  tryUpdateDailyJournalIcon().catch(console.error);
}

(async () => {
  await getTasksFromDatabase();
  main();
})()
