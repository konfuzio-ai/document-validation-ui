<template>
  <div class="multi-ann-table-overlay">
    <b-table
      ref="table"
      class="multi-ann-set-table"
      detail-icon="faScissors"
      :data="rows"
      :columns="columns"
      :sticky-header="true"
      :narrowed="true"
      :bordered="true"
    />
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "MultiAnnotationTablePopup",

  props: {
    annotationsSet: {
      required: true,
      type: Array,
      default: null,
    },
  },
  data() {
    return {
      rows: [
        {
          id: 1,
          first_name: "Jesse",
          last_name: "Simmons",
          date: "2016-10-15 13:43:27",
          gender: "Male",
        },
        {
          id: 2,
          first_name: "John",
          last_name: "Jacobs",
          date: "2016-12-15 06:00:53",
          gender: "Male",
        },
        {
          id: 3,
          first_name: "Tina",
          last_name: "Gilbert",
          date: "2016-04-26 06:26:28",
          gender: "Female",
        },
        {
          id: 4,
          first_name: "Clarence",
          last_name: "Flores",
          date: "2016-04-10 10:28:46",
          gender: "Male",
        },
        {
          id: 5,
          first_name: "Anne",
          last_name: "Lee",
          date: "2016-12-06 14:38:38",
          gender: "Female",
        },
        {
          id: 6,
          first_name: "Anne",
          last_name: "Lee",
          date: "2016-12-06 14:38:38",
          gender: "Female",
        },
        {
          id: 7,
          first_name: "Anne",
          last_name: "Lee",
          date: "2016-12-06 14:38:38",
          gender: "Female",
        },
        {
          id: 8,
          first_name: "Anne",
          last_name: "Lee",
          date: "2016-12-06 14:38:38",
          gender: "Female",
        },
        {
          id: 9,
          first_name: "Anne",
          last_name: "Lee",
          date: "2016-12-06 14:38:38",
          gender: "Female",
        },
        {
          id: 10,
          first_name: "Anne",
          last_name: "Lee",
          date: "2016-12-06 14:38:38",
          gender: "Female",
        },
      ],
      columns: [
        {
          field: "id",
          label: "ID",
          width: "40",
          numeric: true,
        },
        {
          field: "first_name",
          label: "First Name",
        },
        {
          field: "last_name",
          label: "Last Name",
        },
        {
          field: "date",
          label: "Date",
          centered: true,
        },
        {
          field: "gender",
          label: "Gender",
        },
      ],
      counter: 0,
      draggingColumn: null,
      draggingColumnIndex: null,
      orderedEntities: [],
    };
  },
  mounted() {},
  methods: {},
};
</script>
<style
  scoped
  lang="scss"
  src="../../assets/scss/multi_ann_table_overlay.scss"
></style>
