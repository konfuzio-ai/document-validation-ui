<style scoped lang="scss">
.documents-list {
  background-color: var(--bgColor);
  font-family: "Inter", sans-serif;
  .documents-list-top {
    display: flex;
    flex-direction: row;
    padding: 40px;

    .documents-list-top-left {
      flex: 1;

      h2 {
        font-size: 26px;
        color: var(--textColor);
        font-weight: 600;
        line-height: 33px;
        margin: 0;
      }
      p {
        font-size: 14px;
        color: var(--secondaryTextColor);
        font-weight: 400;
        line-height: 20px;
        margin: 0;
      }
    }
    .documents-list-top-right {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;

      .action-box {
        align-self: center;
        width: 75%;
        height: 100%;
        background-color: var(--lowOpacityPrimaryColor);
        display: flex;
        justify-content: center;
        align-items: flex-start;
        position: relative;
        span {
          margin-top: 20px;
          font-weight: 600;
          font-size: 16px;
          line-height: 24px;
          color: var(--textColor);
        }
        button {
          position: absolute;
          bottom: -20px;
          height: 40px;
          background-color: var(--primaryColor);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0 16px;
          font-weight: 500;
          font-size: 14px;
          line-height: 20px;
          cursor: pointer;
          &:hover {
            background-color: var(--hoverPrimaryColor);
          }
        }
      }
    }
  }
  .documents-list-bottom {
    display: flex;
    flex-direction: row;
    margin-top: 14px;
    min-height: 124px;
    cursor: pointer;
    .documents-list-thumbnail {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      &.selected {
        background-color: white;
        border-bottom: 3px solid var(--primaryColor);
      }
      img {
        max-height: 60px;
        &.selected {
          outline: 1px solid var(--thumbnailSelectedColor);
        }
      }
      .document-name {
        margin-top: 14px;
        font-weight: 400;
        font-size: 14px;
        line-height: 20px;
        &.selected {
          font-weight: 600;
        }
      }
    }
  }
}
</style>
<template>
  <div class="documents-list">
    <div class="documents-list-top">
      <div class="documents-list-top-left">
        <h2>Title</h2>
        <p>
          Unter Rechnung wird jedes Dokument verstanden, das die Abrechnung über
          eine Lieferung oder sonstige Leistung zum Inhalt hat, gleichgültig,
          wie dieses Dokument im Geschäftsverkehr bezeichnet wird.
        </p>
      </div>
      <div class="documents-list-top-right">
        <div class="action-box">
          <span>Demozugang kostenfrei anfragen</span>
          <button type="button">Testzugang erhalten</button>
        </div>
      </div>
    </div>
    <div class="documents-list-bottom">
      <div
        :class="[
          'documents-list-thumbnail',
          currentPage == document.id && 'selected'
        ]"
        v-for="document in documents"
        v-bind:key="document.id"
        v-on:click="changeDocument(document.id)"
      >
        <img
          :class="['img-thumbnail', documentId == document.id && 'selected']"
          :src="document.image"
          alt
        />
        <div
          :class="['document-name', documentId == document.id && 'selected']"
        >
          {{ document.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
/*
  results: Array(5)
0:
annotation_sets: Array(1)
assignee: null
categorization_time: null
category: 26
category_confidence: 1
dataset_status: 0
extraction_time: 0.616085529327393
extraction_url: "https://testing.konfuzio.com/api/v1/docs/2222/"
file_url: "/doc/show/2222/"
id: 2222
number_of_pages: 1
ocr_time: 2.85809087753296
project: 5
status_data: 2
text: null

open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security

  */
export default {};
</script>

<style></style>

<script>
import { mapState } from "vuex";

/**
 * This component creates a horizontal list of documents
 * with thumbnail pictures which are clickable.
 */

export default {
  name: "DocumentsList",
  props: {},
  computed: {
    ...mapState("document", ["documents", "documentId"])
  },
  methods: {
    changeDocument(documentId) {
      this.$store.dispatch("document/setDocId", {
        id: documentId
      });
    }
  }
};
</script>
