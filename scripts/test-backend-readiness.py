import importlib.util
from datetime import datetime, timezone
from pathlib import Path
import unittest
from unittest.mock import patch

spec=importlib.util.spec_from_file_location('readiness',Path(__file__).with_name('backend-readiness.py'))
r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)

class DeploymentGates(unittest.TestCase):
    def test_history_rejects_drift_and_historical_seeds(self):
        for rows,versions in [([{'version':'unknown'}],['20261007040000']),([],['20250901']),([{'version':None}],[])]:
            with self.assertRaises(r.ReadinessError):r.check_history(rows,versions)
        self.assertEqual(r.check_history([{'version':'old'}],['old','20261007040000']),['20261007040000'])
        with self.assertRaises(r.ReadinessError):r.check_history([],['20261007040000'],True)
    def test_backups_must_be_completed_recent_and_timezone_aware(self):
        now=datetime(2026,10,7,tzinfo=timezone.utc)
        self.assertIn('Completed',r.check_backup({'backups':[{'status':'COMPLETED','inserted_at':'2026-10-06T00:00:00Z'}]},now))
        for status,time in [('FAILED','2026-10-06T00:00:00Z'),('COMPLETED','2020-01-01T00:00:00Z'),('COMPLETED','2026-10-06'),('COMPLETED','2026-10-09T00:00:00Z')]:
            with self.assertRaises(r.ReadinessError):r.check_backup({'backups':[{'status':status,'inserted_at':time}]},now)
    def test_pitr_flag_without_a_recent_recovery_point_is_insufficient(self):
        now=datetime(2026,10,7,tzinfo=timezone.utc)
        with self.assertRaises(r.ReadinessError):r.check_backup({'pitr_enabled':True},now)
        self.assertIn('physical',r.check_backup({'pitr_enabled':True,'physical_backup_data':{'latest_physical_backup_date_unix':int(now.timestamp())}},now))
    def test_secret_check_uses_names_without_exposing_values(self):
        rows=[{'name':name,'value':'must-never-be-printed'} for name in r.SECRETS]
        self.assertNotIn('must-never',r.check_secrets(rows))
        with self.assertRaises(r.ReadinessError):r.check_secrets(rows[:-1])
    def test_deployed_functions_require_active_and_explicit_auth_settings(self):
        rows=[{'slug':name,'status':'ACTIVE','verify_jwt':False} for name in r.FUNCTIONS]
        self.assertIn('ACTIVE',r.check_functions(rows))
        rows[0]['verify_jwt']=True
        with self.assertRaises(r.ReadinessError):r.check_functions(rows)
    def test_management_errors_do_not_leak_tokens_or_response_bodies(self):
        with patch.object(r.subprocess,'run',return_value=type('Result',(),{'returncode':22,'stdout':'private body','stderr':'private token'})()):
            with self.assertRaises(r.ReadinessError) as error:r.api('private-token','secrets')
            self.assertNotIn('private-token',str(error.exception));self.assertNotIn('private body',str(error.exception))
        with self.assertRaises(r.ReadinessError):r.api('token\ninjected','secrets')

if __name__=='__main__':unittest.main()
