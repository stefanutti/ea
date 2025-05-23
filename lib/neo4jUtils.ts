import { executeQuery } from "./neo4j";

/* ----------------------------Application Management--------------------------- */
export const getApplications = async () => {
  try {
    const results = await executeQuery(
      "MATCH (a:Application) OPTIONAL MATCH (a)-[r]-() RETURN a, COUNT(r) > 0 AS hasRelations",
      {},
      new AbortController().signal
    );

    if (results) {
      return results;
    }
  } catch (error) {
    console.error("Error fetching applications:", error);
    return;
  }
};

export const saveApplication = async (data: any) => {
  if (!data) return;
  try {
    const createNodeQuery = `
          CREATE (a:Application {
            application_id: $application_id,
            name: $name,
            description: $description,
            ownerships: $ownerships,
            application_type: $application_type,
            complexity: $complexity,
            criticality: $criticality,
            processes: $processes,
            active: $active,
            internal_application_specialists: $internal_application_specialists,
            business_partner_business_contacts: $business_partner_business_contacts,
            business_contacts: $business_contacts,
            internal_developers: $internal_developers,
            hosting: $hosting,
            ams: $ams,
            bi: $bi,
            disaster_recovery: $disaster_recovery,
            user_license_type: $user_license_type,
            access_type: $access_type,
            sw_supplier: $sw_supplier,
            ams_expire_date: $ams_expire_date,
            ams_contacts_email: $ams_contacts_email,
            ams_contact_phone: $ams_contact_phone,
            ams_supplier: $ams_supplier,
            smes_factory: $smes_factory,
            ams_portal: $ams_portal,
            organization_family: $organization_family,
            links_to_documentation: $links_to_documentation,
            scope: $scope,
            ams_service: $ams_service,
            ams_type: $ams_type,
            decommission_date: $decommission_date,
            to_be_decommissioned: $to_be_decommissioned,
            notes: $notes,
            links_to_sharepoint_documentation: $links_to_sharepoint_documentation
          })
          RETURN a
        `;

    const result = await executeQuery(createNodeQuery, data);

    if (result && result.length > 0) {
      return result;
    }
  } catch (error) {
    console.error("Error saving application:", error);
    return;
  }
};

export const editApplication = async (data: any) => {
  if (!data) return;

  try {
    const editNodeQuery = `
          MATCH (a:Application { application_id: $application_id })
            SET
              a.name = $name,
              a.description = $description,
              a.ownerships = $ownerships,
              a.application_type = $application_type,
              a.complexity = $complexity,
              a.criticality = $criticality,
              a.processes = $processes,
              a.active = $active,
              a.internal_application_specialists = $internal_application_specialists,
              a.business_partner_business_contacts = $business_partner_business_contacts,
              a.business_contacts = $business_contacts,
              a.internal_developers = $internal_developers,
              a.hosting = $hosting,
              a.ams = $ams,
              a.bi = $bi,
              a.disaster_recovery = $disaster_recovery,
              a.user_license_type = $user_license_type,
              a.access_type = $access_type,
              a.sw_supplier = $sw_supplier,
              a.ams_expire_date = $ams_expire_date,
              a.ams_contacts_email = $ams_contacts_email,
              a.ams_contact_phone = $ams_contact_phone,
              a.ams_supplier = $ams_supplier,
              a.smes_factory = $smes_factory,
              a.ams_portal = $ams_portal,
              a.organization_family = $organization_family,
              a.links_to_documentation = $links_to_documentation,
              a.scope = $scope,
              a.ams_service = $ams_service,
              a.ams_type = $ams_type,
              a.decommission_date = $decommission_date,
              a.to_be_decommissioned = $to_be_decommissioned,
              a.notes = $notes,
              a.links_to_sharepoint_documentation = $links_to_sharepoint_documentation
            RETURN a
        `;

    const result = await executeQuery(editNodeQuery, data);

    if (result && result.length > 0) {
      return result;
    }
  } catch (error) {
    console.error("Error saving application:", error);
    return;
  }
};

export const deleteApplication = async (data: any) => {
  try {
    const deleteAppQuery = `MATCH (n:Application { application_id: "${data.application_id}" }) DELETE n`;
    const result = await executeQuery(deleteAppQuery, {});

    if (result) {
      return result;
    }
  } catch (err) {
    console.error("Error deleting the application ", err);
  }
};

/* ----------------------------Flow Management--------------------------- */
export const getFlows = async () => {
  try {
    const results = await executeQuery(
      "MATCH ()-[r:flow]->() RETURN r",
      {},
      new AbortController().signal
    );

    if (results) {
      return results;
    }
  } catch (error) {
    console.error("Error fetching flows:", error);
    return;
  }
};

export const saveFlow = async (data: any) => {
  if (!data) return;

  try {
    const createFlowQuery = `
          MATCH (initiator:Application {application_id: $initiator_application})
          MATCH (target:Application {application_id: $target_application})
  
          CREATE (initiator)-[f:flow {
            flow_id: $flow_id,
            name: $name,
            description: $description,
            initiator_application: $initiator_application,
            target_application: $target_application,
            communication_mode: $communication_mode,
            intent: $intent,
            message_format: $message_format,
            data_flow: $data_flow,
            protocol: $protocol,
            frequency: $frequency,
            estimated_calls_per_day: $estimated_calls_per_day,
            average_execution_time_in_sec: $average_execution_time_in_sec,
            average_message_size_in_kb: $average_message_size_in_kb,
            api_gateway: $api_gateway,
            release_date: $release_date,
            notes: $notes,
            labels: $labels
          }]->(target)
          RETURN f
        `;

    const result = await executeQuery(createFlowQuery, data);

    if (result && result.length > 0) {
      return result;
    }
  } catch (error) {
    console.error("Error saving flow:", error);
    return;
  }
};

export const editFlow = async (data: any) => {
  if (!data) return;
  try {
    const editFlowQuery = `
          MATCH (initiator:Application {application_id: $initiator_application})
          MATCH (target:Application {application_id: $target_application})
          MATCH (initiator)-[f:flow]->(target)
  
          SET
            f.name = $name,
            f.description = $description,
            f.communication_mode = $communication_mode,
            f.intent = $intent,
            f.message_format = $message_format,
            f.data_flow = $data_flow,
            f.protocol = $protocol,
            f.frequency = $frequency,
            f.estimated_calls_per_day = $estimated_calls_per_day,
            f.average_execution_time_in_sec = $average_execution_time_in_sec,
            f.average_message_size_in_kb = $average_message_size_in_kb,
            f.api_gateway = $api_gateway,
            f.release_date = $release_date,
            f.notes = $notes,
            f.labels = $labels
          RETURN f
          `;

    const result = await executeQuery(editFlowQuery, data);

    if (result && result.length > 0) {
      return result;
    }
  } catch (error) {
    console.error("Error edit flow:", error);
    return;
  }
};

export const deleteFlow = async (data: any) => {
  try {
    const deleteFlowQuery = `MATCH ()-[r:flow]->() WHERE r.flow_id = "${data.flow_id}" DELETE r`;
    const result = await executeQuery(deleteFlowQuery, {});

    if (result) {
      return result;
    }
  } catch (err) {
    console.error("Error deleting the flow ", err);
  }
};
