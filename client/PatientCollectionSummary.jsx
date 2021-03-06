
import React, { useEffect, useState } from 'react';
import { useTracker } from '@ledgy/react-meteor-data';
import { browserHistory } from 'react-router';

import { get, has } from 'lodash';

import { Session } from 'meteor/session';
import { HTTP } from 'meteor/http';
import { EJSON } from 'meteor/ejson';

import moment from 'moment';

import Grid from '@material-ui/core/Grid';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Button from '@material-ui/core/Container';


import HGraph from 'hgraph-react'; // symlinked with 'yarn link' from project root.
import { StyledCard, PageCanvas, PatientCard, PatientsTable } from 'fhir-starter';

import { 
  AllergyIntolerancesTable, 
  CarePlansTable,
  ConditionsTable, 
  DiagnosticReportsTable,
  ImmunizationsTable, 
  MedicationStatementsTable,
  MedicationOrdersTable,
  ObservationsTable,  
  ProceduresTable,
  DynamicSpacer,
  AllergyIntolerances,
  CarePlans,
  Conditions,
  Immunizations,
  MedicationStatements,
  Observations,
  Patients,
  FhirUtilities
} from 'meteor/clinical:hl7-fhir-data-infrastructure';

import { scaleLinear } from 'd3-scale';
import metrics from '../metrics/metrics.healthrecords.json';

let collectionBuckets = [
  {
    "id": "allergyIntoleranceCount",
    "label": "Allergy Intolerances",
    "healthyMin": 0,
    "healthyMax": 10,
    "absoluteMin": 0,
    "absoluteMax": 1000,
    "value": 0,
    "weight": 10,
    "unitLabel": "records"
  },
  {
    "id": "conditionCount",
    "label": "Conditions",
    "healthyMin": 0,
    "healthyMax": 20,
    "absoluteMin": 0,
    "absoluteMax": 1000,
    "value": 0,
    "weight": 10,
    "unitLabel": "records"
  },
  {
    "id": "diagnosticReportCount",
    "label": "Diagnostic Reports",
    "healthyMin": 0,
    "healthyMax": 20,
    "absoluteMin": 0,
    "absoluteMax": 200,
    "value": 0,
    "weight": 10,
    "unitLabel": "records"
  },
  {
    "id": "encounterCount",
    "label": "Encounters",
    "healthyMin": 0,
    "healthyMax": 100,
    "absoluteMin": 0,
    "absoluteMax": 1000,
    "value": 0,
    "weight": 10,
    "unitLabel": "records"
  },
  {
    "id": "immunizationCount",
    "label": "Immunizations",
    "healthyMin": 0,
    "healthyMax": 25,
    "absoluteMin": 0,
    "absoluteMax": 1000,
    "value": 0,
    "weight": 10,
    "unitLabel": "records"
  },
  {
    "id": "medicationCount",
    "label": "Medications",
    "healthyMin": 0,
    "healthyMax": 20,
    "absoluteMin": 0,
    "absoluteMax": 1000,
    "value": 0,
    "weight": 10,
    "unitLabel": "records"
  },
  {
    "id": "medStatementCount",
    "label": "Medication Statements",
    "healthyMin": 0,
    "healthyMax": 100,
    "absoluteMin": 0,
    "absoluteMax": 1000,
    "value": 0,
    "weight": 10,
    "unitLabel": "records"
  },
  {
    "id": "observationCount",
    "label": "Observations",
    "healthyMin": 0,
    "healthyMax": 1000,
    "absoluteMin": 0,
    "absoluteMax": 1000,
    "value": 0,
    "weight": 10,
    "unitLabel": "records"
  },
  {
    "id": "patientCount",
    "label": "Patients",
    "healthyMin": 0,
    "healthyMax": 2,
    "absoluteMin": 0,
    "absoluteMax": 1000,
    "value": 0,
    "weight": 10,
    "unitLabel": "records"
  },
  {
    "id": "procedureCount",
    "label": "Procedures",
    "healthyMin": 0,
    "healthyMax": 20,
    "absoluteMin": 0,
    "absoluteMax": 1000,
    "value": 0,
    "weight": 10,
    "unitLabel": "records"
  },
];

let radarData = [
  {
    "taste": "fruity",
    "chardonay": 32,
    "carmenere": 78,
    "syrah": 46
  },
  {
    "taste": "bitter",
    "chardonay": 72,
    "carmenere": 67,
    "syrah": 120
  },
  {
    "taste": "heavy",
    "chardonay": 39,
    "carmenere": 26,
    "syrah": 97
  },
  {
    "taste": "strong",
    "chardonay": 46,
    "carmenere": 33,
    "syrah": 113
  },
  {
    "taste": "sunny",
    "chardonay": 82,
    "carmenere": 46,
    "syrah": 28
  }
];

// //==========================================================================================
// // Helper Functions

// const hGraphConvert = (gender, metric, data) => {
//   const metricObj = metrics[gender][metric];
//   //const sortedValues = data.values.sort((a, b) => new Date(a.date) - new Date(b.date));

//   return {
//     label: data.label || metricObj.label,
//     value: data.value || metricObj.value[0],
//     values: data.values,

//     healthyMin: data.healthyMin || metricObj.healthyRange[0],
//     healthyMax: data.healthyMax || metricObj.healthyRange[1],
//     absoluteMin: data.absoluteMin || metricObj.absoluteRange[0],
//     absoluteMax: data.absoluteMax || metricObj.absoluteRange[1],
//     weight: data.weight || metricObj.weight,
//     unitLabel: data.unitLabel || metricObj.unitLabel
//   }
// }


//==========================================================================================
// Synthetic Patients   



Meteor.startup(function(){
  Session.setDefault('hideToggles', true);
  Session.setDefault('systemOfMeasurement', 'imperial');
  // Session.setDefault('selectedPatientId', AndreaSantillán.id);
  // Session.setDefault('selectedPatient', AndreaSantillán) 
})


function generateCollectionCounts(data){
  let resultsArray = [];
  let datum;


  collectionBuckets.forEach(function(biomarker){
    switch(biomarker.id){
      case "allergyIntoleranceCount":
        datum = biomarker;
        if(data.allergyIntolerances.length){
          datum.value = data.allergyIntolerances.length;          
        }
        resultsArray.push(datum);  
      break;
      case "conditionCount":
        datum = biomarker;
        if(data.conditions.length){
          datum.value = data.conditions.length;          
        }
        resultsArray.push(datum);  
      break;
      case "diagnosticReportCount":
        datum = biomarker;
        if(data.diagnosticReports.length){
          datum.value = data.diagnosticReports.length;          
        }
        resultsArray.push(datum);  
      break;
      case "encounterCount":
        datum = biomarker;
        if(data.encounters.length){
          datum.value = data.encounters.length;          
        }
        resultsArray.push(datum);  
      break;
      case "immunizationCount":
        datum = biomarker;
        if(data.immunizations.length){
          datum.value = data.immunizations.length;          
        }
        resultsArray.push(datum);  
      break;
      case "medicationCount":
        datum = biomarker;
        if(data.medications.length){
          datum.value = data.medications.length;          
        }
        resultsArray.push(datum);  
      break;
      case "medicationStatementCount":
        datum = biomarker;
        if(data.medicationStatements.length){
          datum.value = data.medicationStatements.length;          
        }
        resultsArray.push(datum);  
      break;
      case "observationCount":
        datum = biomarker;
        if(data.observations.length){
          datum.value = data.observations.length;          
        }
        resultsArray.push(datum);  
      break;
      case "patientCount":
        datum = biomarker;
        if(data.patients.length){
          datum.value = data.patients.length;          
        }
        resultsArray.push(datum);  
      break;
      case "procedureCount":
        datum = biomarker;
        if(data.procedures.length){
          datum.value = data.procedures.length;          
        }
        resultsArray.push(datum);  
      break;
    }
  })

  console.log('PatientCollectionSummary.resultsArray', resultsArray)

  return resultsArray;
}


//==========================================================================================
// Main Component




export function PatientCollectionSummary(props){

  let firstPatientName = "";
  let firstPatientId = "";

  let secondPatientName = "";
  let secondPatientId = "";

  let thirdPatientName = "";
  let thirdPatientId = "";


  let data = {
    query: {},
    currentData: [],
    currentScore: 0,
    allergyIntolerances: [],
    conditions: [],
    diagnosticReports: [],
    encounters: [],
    immunizations: [],
    medications: [],
    medicationStatements: [],
    observations: [],
    patients: [],
    procedures: [],
    selectedPatientId: '',
    selectedPatient: null
  };

  data.selectedPatient = useTracker(function(){    
    return Patients.findOne({id: Session.get('selectedPatientId')})
  }, []);
  data.selectedPatientId = useTracker(function(){
    return Session.get('selectedPatientId');
  }, []);


  data.allergyIntolerances = useTracker(function(){
    return AllergyIntolerances.find().fetch();
  }, []);
  data.conditions = useTracker(function(){
    return Conditions.find().fetch();
  }, []);
  data.diagnosticReports = useTracker(function(){
    return DiagnosticReports.find().fetch();
  }, []);
  data.encounters = useTracker(function(){
    return Encounters.find().fetch();
  }, []);
  data.immunizations = useTracker(function(){
    return Immunizations.find().fetch();
  }, []);
  data.medications = useTracker(function(){
    return Medications.find().fetch();
  }, []);
  data.medicationStatements = useTracker(function(){
    return MedicationStatements.find().fetch();
  }, []);
  data.observations = useTracker(function(){
    // return Observations.find({'subject.reference': 'urn:uuid:' + Session.get('selectedPatientId')}).fetch();
    return Observations.find().fetch();
  }, []);
  data.patients = useTracker(function(){
    return Patients.find().fetch();
  }, []);
  data.procedures = useTracker(function(){
    return Procedures.find().fetch();
  }, []);
  


  // if(AndreaSantillán){
  //   firstPatientName = get(AndreaSantillán, 'name.0.given.0') + ' ' + get(AndreaSantillán, 'name.0.family');;
  //   firstPatientId = get(AndreaSantillán, 'id');
  // }
  // if(AnnMedhurst){
  //   secondPatientName = get(AnnMedhurst, 'name.0.given.0') + ' ' + get(AnnMedhurst, 'name.0.family');;
  //   secondPatientId = get(AnnMedhurst, 'id');
  // }
  // if(BillyeRau){
  //   thirdPatientName = get(BillyeRau, 'name.0.given.0') + ' ' + get(BillyeRau, 'name.0.family');;
  //   thirdPatientId = get(BillyeRau, 'id');
  // }



  let resultingData = [];

  resultingData = generateCollectionCounts(data);


  //console.log('resultingData', resultingData)

  data.currentData = resultingData;
  // console.log('data.currentData', data.currentData)


  console.log("PatientCollectionSummary[data]", data);  


  let headerHeight = LayoutHelpers.calcHeaderHeight();
  let formFactor = LayoutHelpers.determineFormFactor(2);
  let paddingWidth = LayoutHelpers.calcCanvasPaddingWidth();

  // small web window
  let graphSize = (window.innerWidth - 172) * 0.4;

  // // double card layout (smaller)
  // if(window.innerWidth > 768){
  //   graphSize = (window.innerWidth - 172) * 0.4;
  // }

  // iphone & ipad
  if(Meteor.isCordova){
    graphSize = window.innerWidth - 200;
  }

  let themePrimaryColor = get(Meteor, 'settings.public.theme.palette.primaryColor')


  let cardWidth = window.innerWidth - paddingWidth;

  let columnVisibility = {
    sampledData: false,
    codeValue: true
  }

  if(window.innerWidth > 1600){
    columnVisibility.sampledData = true;
  }
  if(Meteor.isCordova){
    columnVisibility.codeValue = false;
  }




  function handleFirstCardClick(){
    console.log('handleFirstCardClick ', AndreaSantillán);

    Session.set('selectedPatientId', AndreaSantillán.id);
    Session.set('selectedPatient', AndreaSantillán)
  }
  function handleSecondCardClick(){
    console.log('handleSecondCardClick ', AnnMedhurst);

    Session.set('selectedPatientId', AnnMedhurst.id);
    Session.set('selectedPatient', AnnMedhurst)
  }
  function handleThirdCardClick(){
    console.log('handleCardClick ', BillyeRau);

    Session.set('selectedPatientId', BillyeRau.id);
    Session.set('selectedPatient', BillyeRau)
  }


  let selectedPatientElements;
  let collectionManagementElements;
  let pageContextTitle = "Data Currently Loaded in Client"
  let pageContextSubheader = ""

  let cardHeight;
  let selectedPatientElementStyle = {
    fontSize: '180%', 
    cursor: 'pointer'
  };

  
  if(Package['symptomatic:data-management']){
    import { CollectionManagement } from 'meteor/symptomatic:data-management';

    if(data.selectedPatientId){
      pageContextSubheader = data.selectedPatientId;
      pageContextTitle = FhirUtilities.assembleName(Patients.findOne({id: data.selectedPatientId}))
      
      selectedPatientElements = <div style={selectedPatientElementStyle} onClick={handleFirstCardClick.bind(this)}>
        <DynamicSpacer />
        <h4 className="barcode barcodes" style={{fontWeight: 200, margin: '0px', padding: '0px', fontSize: '60%'}}>{data.selectedPatientId}</h4>                        
        {/* <StyledCard margin={20} >
          <CardHeader 
            title={pageContextTitle} 
            style={{marginBottom: '0px', paddingBottom: '10px'}}
          />                             
        </StyledCard> */}
        <DynamicSpacer />
        <PatientCard 
          showName={false}
          patient={data.selectedPatient}
        />                                                        
      </div>
    } else {
      cardHeight = "auto"
    }

    collectionManagementElements = <div>
      <StyledCard margin={20} height={cardHeight}>
        <CardHeader 
          title={pageContextTitle}
          subheader={pageContextSubheader}
          style={{marginBottom: '0px', paddingBottom: '10px'}}
        /> 
        <DynamicSpacer />
        <CollectionManagement 
          mode="additive"
          // resourceTypes={["AllergyIntolerance", "Bundle", "CarePlan", "Claim", "Condition", "Device", "DiagnosticReport", "Encounter", "ExplanationOfBenefit", "FamilyMemberHistory", "Goal", "Immunization", "Medication", "MedicationOrder", "MedicationStatement", "Observation", "Person", "Procedure", "Practitioners", "Questionnaire", "QuestionnaireResponse", "RelatedPerson", "Sequences"]}
          displayExportCheckmarks={false}
          displayExportButton={false}
          displayIcons={true}
          displayPreview={false}
          displayImportCheckmarks={false}
          selectedPatientId={firstPatientId}
          tableSize="medium"
          displayIcons={true}
        />
      </StyledCard>    
    </div>
  }


  return (
    <PageCanvas id='PatientCollectionSummary' headerHeight={headerHeight} paddingLeft={paddingWidth} paddingRight={paddingWidth} >       
      <Grid container >      
        <Grid item lg={4}>
          { selectedPatientElements }
          { collectionManagementElements }   
        </Grid>
        <Grid item lg={8} style={{textAlign: 'center'}} >

          <HGraph
            data={ data.currentData }
            // score={ 42 }
            width={ graphSize }
            height={ graphSize }
            fontSize={ graphSize < 300 ? 10 : 16 }
            pointRadius={ graphSize < 300 ? 5 : 10 }
            scoreFontSize={ graphSize < 300 ? 48 : 96 }
            healthyRangeFillColor={themePrimaryColor}
            showScore={ false }
            margin={{ top: 140, right: 72, bottom: 140, left: 72 }}      
            zoomOnPointClick={false}           
          />     
        </Grid>
      </Grid>  
    </PageCanvas>
  );
}


export default PatientCollectionSummary;