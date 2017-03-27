#!/usr/bin/env python2
# -*- coding: utf-8 -*-

import ConfigParser
import json
import sys
import urllib

class BuildsChecker(object):
  def __init__(self, url, path):
    super(BuildsChecker, self).__init__()
    self.url = url
    self.path = path
    self.hasUpdate = False

    self.config = ConfigParser.SafeConfigParser()
    self.config.read(self.path)

    self.builds = self.get_builds()

  def __del__(self):
    self.sync()

  def get_builds(self):
    f = urllib.urlopen(self.url)
    try:
      return json.load(f)
    finally:
      f.close()

  def get_browsers(self):
    browsers = {}
    for b in self.builds:
      k, v = b['location'].split(':')
      browsers.setdefault(k, []).append(v)
    return browsers

  def update(self):
    for k, v in self.get_browsers().iteritems():
      browsers = ','.join(['"%s"' % b for b in v])
      self.config.set(k, 'browser', browsers)
    self.hasUpdate = True

  def sync(self):
    if not self.hasUpdate: return

    with open(self.path, 'w') as fp:
      self.config.write(fp)

    self.hasUpdate = False

def main(args):
  server, ini = args[0:2]
  c = BuildsChecker(server, ini)
  c.update()

if __name__ == '__main__':
  main(sys.argv[1:])
